/**
 * ContributionDB — SQLite via better-sqlite3.
 *
 * Stores members, contributions, vouches, projects, votes, tasks,
 * streaks, challenges, analysis runs, and GitHub events.
 */

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import type {
  Member,
  Contribution,
  ContributionInput,
  PointBreakdown,
  CommunityProject,
  ProjectTask,
  Season,
  SystemStats,
  VouchCheck,
  VoteResult,
  GitHubEvent,
} from '@exitstorm/core';
import { LEVELS } from '@exitstorm/core';
import { runMigrations } from './migrate.js';

export class ContributionDB {
  public db: DatabaseType;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Run all migrations and return `this` for chaining.
   */
  init(): this {
    runMigrations(this.db);
    return this;
  }

  // ──── Members ────────────────────────────────────────────────────────────

  upsertMember(discordId: string, username: string, displayName?: string | null, isBot = false): void {
    this.db.prepare(`
      INSERT INTO members (discord_id, username, display_name, is_bot)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
        username = excluded.username,
        display_name = COALESCE(excluded.display_name, display_name),
        is_bot = COALESCE(excluded.is_bot, is_bot),
        updated_at = datetime('now')
    `).run(discordId, username, displayName ?? null, isBot ? 1 : 0);
  }

  getMember(discordId: string): Member | undefined {
    return this.db.prepare(`
      SELECT m.*, COALESCE(ms.current_streak, 0) AS current_streak,
             COALESCE(ms.longest_streak, 0) AS longest_streak,
             ms.last_active_date
      FROM members m
      LEFT JOIN member_streaks ms ON ms.member_id = m.discord_id
      WHERE m.discord_id = ?
    `).get(discordId) as Member | undefined;
  }

  linkGitHub(discordId: string, githubUsername: string): void {
    this.db.prepare(
      "UPDATE members SET github_username = ?, updated_at = datetime('now') WHERE discord_id = ?",
    ).run(githubUsername, discordId);
  }

  getMemberByGithub(githubUsername: string): Member | undefined {
    return this.db.prepare(
      'SELECT * FROM members WHERE LOWER(github_username) = LOWER(?)',
    ).get(githubUsername) as Member | undefined;
  }

  // ──── Contributions ──────────────────────────────────────────────────────

  addContribution(input: ContributionInput): void {
    const seasonId = input.seasonId ?? this.getActiveSeason()?.id ?? null;
    const sql = input.createdAt
      ? `INSERT INTO contributions (member_id, type, points, raw_score, multiplier, evidence,
         channel_id, channel_name, source, message_ids, season_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO contributions (member_id, type, points, raw_score, multiplier, evidence,
         channel_id, channel_name, source, message_ids, season_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params: unknown[] = [
      input.memberId, input.type, input.points,
      input.rawScore ?? null, input.multiplier ?? 1.0,
      input.evidence ? JSON.stringify(input.evidence) : null,
      input.channelId ?? null, input.channelName ?? null,
      input.source,
      input.messageIds ? JSON.stringify(input.messageIds) : null,
      seasonId,
    ];
    if (input.createdAt) params.push(input.createdAt);

    this.db.prepare(sql).run(...params);
    this.recalcMemberPoints(input.memberId);
  }

  getContributions(memberId: string, limit = 20): Contribution[] {
    return this.db.prepare(
      'SELECT * FROM contributions WHERE member_id = ? ORDER BY created_at DESC LIMIT ?',
    ).all(memberId, limit) as Contribution[];
  }

  getPointBreakdown(discordId: string): PointBreakdown[] {
    return this.db.prepare(`
      SELECT type, COUNT(*) as count, SUM(points) as total_points
      FROM contributions WHERE member_id = ?
      GROUP BY type ORDER BY total_points DESC
    `).all(discordId) as PointBreakdown[];
  }

  // ──── Leaderboard ────────────────────────────────────────────────────────

  getLeaderboard(opts: { limit?: number; season?: boolean } = {}): Member[] {
    const { limit = 15, season = false } = opts;
    const orderCol = season ? 'season_points' : 'total_points';
    return this.db.prepare(`
      SELECT * FROM members
      WHERE ${orderCol} > 0 AND (is_bot = 0 OR is_bot IS NULL)
      ORDER BY ${orderCol} DESC LIMIT ?
    `).all(limit) as Member[];
  }

  // ──── Points Recalculation ───────────────────────────────────────────────

  recalcMemberPoints(discordId: string): void {
    const total = (this.db.prepare(
      'SELECT COALESCE(SUM(points), 0) as total FROM contributions WHERE member_id = ?',
    ).get(discordId) as { total: number }).total;

    const season = this.getActiveSeason();
    let seasonPoints = 0;
    if (season) {
      seasonPoints = (this.db.prepare(
        'SELECT COALESCE(SUM(points), 0) as total FROM contributions WHERE member_id = ? AND season_id = ?',
      ).get(discordId, season.id) as { total: number }).total;
    }

    const reversed = [...LEVELS].reverse();
    const memberLevel = reversed.find((l) => total >= l.min) ?? LEVELS[0];

    this.db.prepare(`
      UPDATE members SET total_points = ?, season_points = ?,
        level = ?, level_name = ?, updated_at = datetime('now')
      WHERE discord_id = ?
    `).run(total, seasonPoints, memberLevel.level, memberLevel.name, discordId);
  }

  // ──── Vouching ───────────────────────────────────────────────────────────

  canVouch(voterId: string, recipientId: string): VouchCheck {
    if (voterId === recipientId) return { allowed: false, reason: "can't vouch yourself" };

    const todayCount = (this.db.prepare(
      "SELECT COUNT(*) as cnt FROM vouches WHERE voter_id = ? AND created_at >= date('now')",
    ).get(voterId) as { cnt: number }).cnt;
    if (todayCount >= 3) return { allowed: false, reason: "you've used all 3 vouches today" };

    const weekCount = (this.db.prepare(
      "SELECT COUNT(*) as cnt FROM vouches WHERE voter_id = ? AND recipient_id = ? AND created_at >= date('now', '-7 days')",
    ).get(voterId, recipientId) as { cnt: number }).cnt;
    if (weekCount >= 1) return { allowed: false, reason: 'you already vouched for this person this week' };

    return { allowed: true };
  }

  addVouch(voterId: string, recipientId: string, reason: string, points = 5): void {
    const seasonId = this.getActiveSeason()?.id ?? null;
    this.db.prepare(
      'INSERT INTO vouches (voter_id, recipient_id, reason, points, season_id) VALUES (?, ?, ?, ?, ?)',
    ).run(voterId, recipientId, reason, points, seasonId);

    this.addContribution({
      memberId: recipientId,
      type: 'peer_vouch',
      points,
      evidence: { vouched_by: voterId, reason },
      source: 'peer_vote',
      seasonId: seasonId ?? undefined,
    });
  }

  // ──── Seasons ────────────────────────────────────────────────────────────

  getActiveSeason(): Season | undefined {
    return this.db.prepare(
      'SELECT * FROM seasons WHERE active = 1 ORDER BY id DESC LIMIT 1',
    ).get() as Season | undefined;
  }

  // ──── Projects ───────────────────────────────────────────────────────────

  getProject(id: number): CommunityProject | undefined {
    return this.db.prepare(
      'SELECT * FROM community_projects WHERE id = ?',
    ).get(id) as CommunityProject | undefined;
  }

  listProjects(status?: string): CommunityProject[] {
    if (status) {
      return this.db.prepare(
        'SELECT * FROM community_projects WHERE status = ? ORDER BY created_at DESC',
      ).all(status) as CommunityProject[];
    }
    return this.db.prepare(
      "SELECT * FROM community_projects WHERE status IN ('active','voting') ORDER BY created_at DESC",
    ).all() as CommunityProject[];
  }

  saveProjectAnalysis(projectId: number, analysis: object): void {
    this.db.prepare(
      "UPDATE community_projects SET analysis_json = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(JSON.stringify(analysis), projectId);
  }

  // ──── Stats ──────────────────────────────────────────────────────────────

  getStats(): SystemStats {
    const members = (this.db.prepare('SELECT COUNT(*) as cnt FROM members WHERE total_points > 0 AND (is_bot = 0 OR is_bot IS NULL)').get() as { cnt: number }).cnt;
    const contributions = (this.db.prepare('SELECT COUNT(*) as cnt FROM contributions').get() as { cnt: number }).cnt;
    const totalPoints = (this.db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM contributions').get() as { total: number }).total;
    const vouches = (this.db.prepare('SELECT COUNT(*) as cnt FROM vouches').get() as { cnt: number }).cnt;
    const analysisRuns = (this.db.prepare('SELECT COUNT(*) as cnt FROM analysis_runs').get() as { cnt: number }).cnt;
    const activeSeason = this.getActiveSeason() ?? null;
    return { members, contributions, totalPoints, vouches, analysisRuns, activeSeason };
  }

  // ──── GitHub Events ──────────────────────────────────────────────────────

  hasGithubEvent(eventId: string): boolean {
    return !!this.db.prepare('SELECT 1 FROM github_events WHERE event_id = ?').get(eventId);
  }

  recordGithubEvent(event: Omit<GitHubEvent, 'id' | 'created_at'>): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO github_events (event_id, event_type, repo, github_author, discord_id, points_awarded, dry_run)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(event.event_id, event.event_type, event.repo, event.github_author, event.discord_id, event.points_awarded, event.dry_run ? 1 : 0);
  }

  // ──── Lifecycle ──────────────────────────────────────────────────────────

  close(): void {
    this.db.close();
  }
}
