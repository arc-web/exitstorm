import { describe, it, expect, afterEach } from 'vitest';
import { ContributionDB } from '../src/contribution-db.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

let dbPath: string;
let db: ContributionDB;

function makeDb(): ContributionDB {
  dbPath = join(tmpdir(), `exitstorm-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  const instance = new ContributionDB(dbPath).init();
  return instance;
}

afterEach(() => {
  if (db) {
    try { db.close(); } catch { /* already closed */ }
  }
  if (dbPath && existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  // clean up WAL files
  for (const suffix of ['-wal', '-shm']) {
    const f = dbPath + suffix;
    if (f && existsSync(f)) unlinkSync(f);
  }
});

// ── Members ────────────────────────────────────────────────────────────────

describe('upsert and retrieve member', () => {
  it('inserts a member and retrieves it', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice', 'Alice Smith');
    const member = db.getMember('u1');
    expect(member).toBeDefined();
    expect(member?.username).toBe('alice');
    expect(member?.display_name).toBe('Alice Smith');
  });
});

describe('update on re-upsert', () => {
  it('updates username on second upsert', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice', 'Alice');
    db.upsertMember('u1', 'alice_updated', 'Alice Updated');
    const member = db.getMember('u1');
    expect(member?.username).toBe('alice_updated');
  });
});

describe('link GitHub account', () => {
  it('links a github username to a member', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice');
    db.linkGitHub('u1', 'alice-gh');
    const member = db.getMember('u1');
    expect(member?.github_username).toBe('alice-gh');
  });
});

describe('find member by GitHub username', () => {
  it('finds member via github username (case-insensitive)', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice');
    db.linkGitHub('u1', 'Alice-GH');
    const found = db.getMemberByGithub('alice-gh');
    expect(found).toBeDefined();
    expect(found?.discord_id).toBe('u1');
  });

  it('returns undefined for unknown github username', () => {
    db = makeDb();
    const found = db.getMemberByGithub('nobody');
    expect(found).toBeUndefined();
  });
});

// ── Contributions ──────────────────────────────────────────────────────────

describe('add contribution updates member points', () => {
  it('updates total_points after adding contribution', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice');
    db.addContribution({
      memberId: 'u1',
      type: 'helpful_conversation',
      points: 10,
      source: 'ai_analysis',
    });
    const member = db.getMember('u1');
    expect(member?.total_points).toBe(10);
  });
});

describe('contribution history ordering', () => {
  it('returns all contributions for a member ordered by id desc', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice');
    db.addContribution({ memberId: 'u1', type: 'helpful_conversation', points: 5, source: 'ai_analysis' });
    db.addContribution({ memberId: 'u1', type: 'tool_share', points: 10, source: 'ai_analysis' });
    const contribs = db.getContributions('u1');
    expect(contribs.length).toBe(2);
    const types = contribs.map((c) => c.type);
    expect(types).toContain('helpful_conversation');
    expect(types).toContain('tool_share');
  });
});

describe('point breakdown by type', () => {
  it('groups contributions by type and sums points', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice');
    db.addContribution({ memberId: 'u1', type: 'helpful_conversation', points: 5, source: 'ai_analysis' });
    db.addContribution({ memberId: 'u1', type: 'helpful_conversation', points: 5, source: 'ai_analysis' });
    db.addContribution({ memberId: 'u1', type: 'tool_share', points: 10, source: 'ai_analysis' });
    const breakdown = db.getPointBreakdown('u1');
    const hc = breakdown.find((b) => b.type === 'helpful_conversation');
    expect(hc?.total_points).toBe(10);
    expect(hc?.count).toBe(2);
  });
});

// ── Leaderboard ────────────────────────────────────────────────────────────

describe('leaderboard sorted by points, excludes bots', () => {
  it('sorts non-bot members by total_points descending', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice', null, false);
    db.upsertMember('u2', 'bob', null, false);
    db.upsertMember('bot1', 'mybot', null, true);
    db.addContribution({ memberId: 'u1', type: 'helpful_conversation', points: 20, source: 'ai_analysis' });
    db.addContribution({ memberId: 'u2', type: 'helpful_conversation', points: 50, source: 'ai_analysis' });
    db.addContribution({ memberId: 'bot1', type: 'helpful_conversation', points: 999, source: 'ai_analysis' });
    const board = db.getLeaderboard();
    // bot1 should not appear
    expect(board.find((m) => m.discord_id === 'bot1')).toBeUndefined();
    // bob has more points, should be first
    expect(board[0].discord_id).toBe('u2');
    expect(board[1].discord_id).toBe('u1');
  });
});

// ── Vouching ───────────────────────────────────────────────────────────────

describe('vouch validation - self-vouch blocked', () => {
  it('blocks self-vouch', () => {
    db = makeDb();
    const check = db.canVouch('u1', 'u1');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("can't vouch yourself");
  });
});

describe('vouch validation - valid vouch allowed', () => {
  it('allows a valid vouch between different members', () => {
    db = makeDb();
    const check = db.canVouch('u1', 'u2');
    expect(check.allowed).toBe(true);
  });
});

describe('vouch awards points', () => {
  it('adds peer_vouch contribution to recipient', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice');
    db.upsertMember('u2', 'bob');
    db.addVouch('u1', 'u2', 'great help', 5);
    const member = db.getMember('u2');
    expect(member?.total_points).toBe(5);
    const contribs = db.getContributions('u2');
    expect(contribs.some((c) => c.type === 'peer_vouch')).toBe(true);
  });
});

// ── Stats ──────────────────────────────────────────────────────────────────

describe('system stats', () => {
  it('returns correct member and contribution counts', () => {
    db = makeDb();
    db.upsertMember('u1', 'alice');
    db.addContribution({ memberId: 'u1', type: 'helpful_conversation', points: 10, source: 'ai_analysis' });
    const stats = db.getStats();
    expect(stats.members).toBe(1);
    expect(stats.contributions).toBe(1);
    expect(stats.totalPoints).toBe(10);
  });
});

// ── GitHub event deduplication ─────────────────────────────────────────────

describe('GitHub event deduplication', () => {
  it('returns false for unknown event_id', () => {
    db = makeDb();
    expect(db.hasGithubEvent('pr_merged:repo:1')).toBe(false);
  });

  it('returns true after recording the same event_id', () => {
    db = makeDb();
    db.recordGithubEvent({
      event_id: 'pr_merged:repo:42',
      event_type: 'pr_merged',
      repo: 'org/repo',
      github_author: 'alice',
      discord_id: 'u1',
      points_awarded: 25,
      dry_run: false,
    });
    expect(db.hasGithubEvent('pr_merged:repo:42')).toBe(true);
  });

  it('does not throw on duplicate insert (INSERT OR IGNORE)', () => {
    db = makeDb();
    const event = {
      event_id: 'pr_merged:repo:99',
      event_type: 'pr_merged',
      repo: 'org/repo',
      github_author: 'bob',
      discord_id: null,
      points_awarded: 10,
      dry_run: false,
    };
    db.recordGithubEvent(event);
    expect(() => db.recordGithubEvent(event)).not.toThrow();
  });
});
