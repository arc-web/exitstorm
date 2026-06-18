# ExitStorm Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ExitStorm's core packages build, run, and be callable by any AI agent that reads the repo - no wrappers, no CLI, no slash commands needed.

**Architecture:** Strip the repo down to the working backend packages (core, db, analyzer, team-engine). Fix the graphics package to use a configurable image gen approach instead of a hardcoded path. Add a thin `analyze-cli.ts` entry point so agents can also shell out to it. Add tests so the agent can verify things work. Remove the dead Discord bot scaffolding and static web mockup.

**Tech Stack:** TypeScript (strict, ESM), pnpm workspaces, Turborepo, better-sqlite3, Anthropic SDK, vitest

---

## File Structure

**Keep as-is (working):**
- `packages/core/src/` - types, constants, utils (no changes needed)
- `packages/db/src/` - ContributionDB, migrations (no changes needed)
- `packages/analyzer/src/` - AI analysis engine (no changes needed)
- `packages/team-engine/src/` - recommender, allocator (no changes needed)
- `tsconfig.base.json`, `turbo.json`, `pnpm-workspace.yaml` - monorepo config

**Modify:**
- `packages/graphics/src/index.ts` - replace hardcoded script path with env var + skip-if-missing behavior
- `package.json` (root) - remove bot/web scripts, add test script
- `.env.example` (create at root) - document required env vars

**Remove:**
- `apps/discord-bot/` - slash command scaffolding, not needed
- `apps/web/` - static mockup, not needed
- `apps/api/` - REST wrapper, not needed (agents call packages directly)

**Create:**
- `packages/analyzer/src/cli.ts` - thin CLI entry point: `npx tsx packages/analyzer/src/cli.ts "Title" "Description"`
- `packages/core/test/utils.test.ts` - tests for priority score, level info, formatting
- `packages/analyzer/test/analyze.test.ts` - tests for parser, prompt builder
- `packages/team-engine/test/allocator.test.ts` - tests for points allocation
- `packages/db/test/db.test.ts` - tests for DB CRUD operations
- `vitest.config.ts` (root) - test runner config

---

### Task 1: Install dependencies and verify build

**Files:**
- Existing: `package.json`, all `packages/*/package.json`

- [ ] **Step 1: Install pnpm dependencies**

```bash
cd ~/exitstorm && pnpm install
```

Expected: clean install, no errors. If pnpm version mismatch, run `corepack enable && corepack prepare pnpm@9.15.4 --activate` first.

- [ ] **Step 2: Build all packages**

```bash
cd ~/exitstorm && pnpm build
```

Expected: `core` builds first, then `db`/`analyzer`/`team-engine`/`graphics` in parallel. All produce `dist/` directories with `.js` and `.d.ts` files.

- [ ] **Step 3: Verify dist output exists**

```bash
ls packages/core/dist/index.js packages/analyzer/dist/index.js packages/db/dist/index.js packages/team-engine/dist/index.js packages/graphics/dist/index.js
```

Expected: all 5 files exist.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: verify clean install and build"
```

---

### Task 2: Remove dead apps

**Files:**
- Remove: `apps/discord-bot/`, `apps/web/`, `apps/api/`
- Modify: `package.json` (root)

- [ ] **Step 1: Delete the apps directory**

```bash
cd ~/exitstorm && rm -rf apps/
```

- [ ] **Step 2: Remove app-specific scripts from root package.json**

Remove these scripts from `package.json`:
- `bot:dev`
- `bot:start`
- `web:dev`
- `api:dev`

Keep: `build`, `dev`, `typecheck`, `lint`, `clean`, `db:migrate`

- [ ] **Step 3: Verify build still works**

```bash
cd ~/exitstorm && pnpm install && pnpm build
```

Expected: builds cleanly. The workspace only finds `packages/*` now.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove dead app scaffolding (discord-bot, web, api)"
```

---

### Task 3: Fix graphics package - remove hardcoded path

**Files:**
- Modify: `packages/graphics/src/index.ts`

- [ ] **Step 1: Replace the hardcoded DEFAULT_SCRIPT with env var lookup**

In `packages/graphics/src/index.ts`, replace:

```typescript
const DEFAULT_SCRIPT = '/opt/homebrew/lib/node_modules/clawdbot/skills/nano-banana-pro/scripts/generate_image.py';
```

With:

```typescript
const DEFAULT_SCRIPT = process.env.EXITSTORM_IMAGE_SCRIPT ?? '';
```

- [ ] **Step 2: Add early return when no script is configured**

In the `generateProjectGraphics` function, after `const scriptPath = ...`, add a guard:

```typescript
  if (!scriptPath) {
    console.log('[graphics] No image generation script configured (set EXITSTORM_IMAGE_SCRIPT). Skipping.');
    return { pricingChart: null, exitChart: null, competitorLandscape: null };
  }
```

- [ ] **Step 3: Verify build**

```bash
cd ~/exitstorm && pnpm --filter @exitstorm/graphics build
```

Expected: builds cleanly.

- [ ] **Step 4: Commit**

```bash
git add packages/graphics/src/index.ts && git commit -m "fix: make graphics script path configurable via EXITSTORM_IMAGE_SCRIPT env var"
```

---

### Task 4: Create .env.example at root

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create the file**

```bash
cat > ~/exitstorm/.env.example << 'ENVEOF'
# ExitStorm - Environment Variables
# Copy to .env and fill in your values

# AI Provider (at least one required for analysis)
ANTHROPIC_API_KEY=           # sk-ant-api* format
OPENAI_API_KEY=              # sk-* format (fallback if Anthropic unavailable)

# Database
DB_PATH=data/contributions.db

# Graphics (optional - path to image generation script)
EXITSTORM_IMAGE_SCRIPT=
ENVEOF
```

- [ ] **Step 2: Commit**

```bash
cd ~/exitstorm && git add .env.example && git commit -m "docs: add .env.example with required env vars"
```

---

### Task 5: Add CLI entry point for analyzer

**Files:**
- Create: `packages/analyzer/src/cli.ts`

- [ ] **Step 1: Write the CLI entry point**

Create `packages/analyzer/src/cli.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * CLI entry point for ExitStorm analyzer.
 *
 * Usage:
 *   npx tsx packages/analyzer/src/cli.ts "Project Title" "Project description"
 *
 * Requires ANTHROPIC_API_KEY or OPENAI_API_KEY in environment.
 * Outputs full ProjectAnalysis as JSON to stdout.
 */

import { analyzeProject } from './analyze.js';
import { allocateProjectPoints } from '@exitstorm/team-engine';

const [title, description] = process.argv.slice(2);

if (!title || !description) {
  console.error('Usage: npx tsx packages/analyzer/src/cli.ts "Title" "Description"');
  process.exit(1);
}

async function main() {
  const analysis = await analyzeProject(title, description);
  const allocation = allocateProjectPoints(title, analysis);

  const result = {
    analysis,
    allocation,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Add a `cli` script to analyzer's package.json**

Add to `packages/analyzer/package.json` scripts:

```json
"cli": "tsx src/cli.ts"
```

- [ ] **Step 3: Add tsx as a dev dependency to analyzer**

```bash
cd ~/exitstorm && pnpm --filter @exitstorm/analyzer add -D tsx
```

- [ ] **Step 4: Verify it builds**

```bash
cd ~/exitstorm && pnpm build
```

- [ ] **Step 5: Commit**

```bash
cd ~/exitstorm && git add packages/analyzer/src/cli.ts packages/analyzer/package.json && git commit -m "feat: add CLI entry point for analyzer"
```

---

### Task 6: Add vitest and write core tests

**Files:**
- Create: `vitest.config.ts`, `packages/core/test/utils.test.ts`
- Modify: `package.json` (root)

- [ ] **Step 1: Install vitest**

```bash
cd ~/exitstorm && pnpm add -D -w vitest
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Add test script to root package.json**

Add to root `package.json` scripts:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write core utils tests**

Create `packages/core/test/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computePriorityScore, priorityVerdict, getLevelInfo, formatCurrency, clamp } from '../src/index.js';

describe('computePriorityScore', () => {
  it('returns weighted average of 8 criteria', () => {
    const criteria = {
      arrQuality: 8,
      churnAchievability: 7,
      founderDependenceInv: 9,
      ruleOf40Potential: 7,
      pricingPower: 8,
      marketTiming: 8,
      buildSpeed: 7,
      defensibility: 6,
    };
    const score = computePriorityScore(criteria);
    // Manual calc: 8*.15 + 7*.10 + 9*.10 + 7*.15 + 8*.10 + 8*.10 + 7*.15 + 6*.15
    // = 1.2 + 0.7 + 0.9 + 1.05 + 0.8 + 0.8 + 1.05 + 0.9 = 7.4
    expect(score).toBe(7.4);
  });

  it('returns 0 for all zeros', () => {
    const criteria = {
      arrQuality: 0, churnAchievability: 0, founderDependenceInv: 0,
      ruleOf40Potential: 0, pricingPower: 0, marketTiming: 0,
      buildSpeed: 0, defensibility: 0,
    };
    expect(computePriorityScore(criteria)).toBe(0);
  });

  it('returns 10 for all tens', () => {
    const criteria = {
      arrQuality: 10, churnAchievability: 10, founderDependenceInv: 10,
      ruleOf40Potential: 10, pricingPower: 10, marketTiming: 10,
      buildSpeed: 10, defensibility: 10,
    };
    expect(computePriorityScore(criteria)).toBe(10);
  });
});

describe('priorityVerdict', () => {
  it('returns "build first" for 8+', () => {
    expect(priorityVerdict(8.0)).toBe('build first');
    expect(priorityVerdict(9.5)).toBe('build first');
  });

  it('returns "solid" for 7-7.9', () => {
    expect(priorityVerdict(7.0)).toBe('solid');
    expect(priorityVerdict(7.9)).toBe('solid');
  });

  it('returns "queue it" for 5-6.9', () => {
    expect(priorityVerdict(5.0)).toBe('queue it');
    expect(priorityVerdict(6.9)).toBe('queue it');
  });

  it('returns "don\'t build" for <5', () => {
    expect(priorityVerdict(4.9)).toBe("don't build");
    expect(priorityVerdict(0)).toBe("don't build");
  });
});

describe('getLevelInfo', () => {
  it('returns Newcomer for 0 points', () => {
    expect(getLevelInfo(0).name).toBe('Newcomer');
    expect(getLevelInfo(0).level).toBe(1);
  });

  it('returns Architect for 5000+ points', () => {
    expect(getLevelInfo(5000).name).toBe('Architect');
    expect(getLevelInfo(5000).level).toBe(7);
  });

  it('returns next level info', () => {
    const info = getLevelInfo(100);
    expect(info.name).toBe('Participant');
    expect(info.next?.name).toBe('Contributor');
  });

  it('returns null next for max level', () => {
    expect(getLevelInfo(5000).next).toBeNull();
  });
});

describe('formatCurrency', () => {
  it('formats thousands as K', () => {
    expect(formatCurrency(96000)).toBe('$96K');
  });

  it('formats millions as M', () => {
    expect(formatCurrency(1500000)).toBe('$1.5M');
  });

  it('formats small amounts as-is', () => {
    expect(formatCurrency(500)).toBe('$500');
  });
});

describe('clamp', () => {
  it('clamps below min', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it('clamps above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('passes through values in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd ~/exitstorm && pnpm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd ~/exitstorm && git add vitest.config.ts package.json packages/core/test/ && git commit -m "test: add vitest and core utils tests"
```

---

### Task 7: Add analyzer tests (prompt builder + parser)

**Files:**
- Create: `packages/analyzer/test/analyze.test.ts`

- [ ] **Step 1: Write analyzer tests**

Create `packages/analyzer/test/analyze.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt } from '../src/prompt.js';

describe('buildAnalysisPrompt', () => {
  it('includes the project title and description', () => {
    const prompt = buildAnalysisPrompt('AdLens', 'AI ad optimization for SMBs');
    expect(prompt).toContain('AdLens');
    expect(prompt).toContain('AI ad optimization for SMBs');
  });

  it('includes existing projects when provided', () => {
    const prompt = buildAnalysisPrompt('AdLens', 'AI ad optimization', [
      { title: 'CloseBot', description: 'Sales automation tool' },
    ]);
    expect(prompt).toContain('CloseBot');
    expect(prompt).toContain('Sales automation tool');
  });

  it('omits existing projects section when empty', () => {
    const prompt = buildAnalysisPrompt('AdLens', 'AI ad optimization', []);
    expect(prompt).not.toContain('Existing pipeline projects');
  });

  it('includes all 8 grading criteria definitions', () => {
    const prompt = buildAnalysisPrompt('Test', 'Test');
    expect(prompt).toContain('arrQuality');
    expect(prompt).toContain('churnAchievability');
    expect(prompt).toContain('founderDependenceInv');
    expect(prompt).toContain('ruleOf40Potential');
    expect(prompt).toContain('pricingPower');
    expect(prompt).toContain('marketTiming');
    expect(prompt).toContain('buildSpeed');
    expect(prompt).toContain('defensibility');
  });

  it('includes valuation multiples', () => {
    const prompt = buildAnalysisPrompt('Test', 'Test');
    expect(prompt).toContain('8-12x ARR');
    expect(prompt).toContain('2.5-4.5x SDE');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd ~/exitstorm && pnpm test
```

Expected: all tests pass (core + analyzer).

- [ ] **Step 3: Commit**

```bash
cd ~/exitstorm && git add packages/analyzer/test/ && git commit -m "test: add analyzer prompt builder tests"
```

---

### Task 8: Add allocator tests

**Files:**
- Create: `packages/team-engine/test/allocator.test.ts`

- [ ] **Step 1: Write allocator tests**

Create `packages/team-engine/test/allocator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { allocateProjectPoints } from '../src/allocator.js';
import type { ProjectAnalysis } from '@exitstorm/core';

function makeAnalysis(overrides: Partial<ProjectAnalysis> = {}): ProjectAnalysis {
  return {
    appType: 'B2B SaaS',
    device: 'Web-first',
    market: 'SMB',
    pricingModel: 'Subscription',
    timeToValue: 'Immediate (<5min)',
    pricePoints: { entry: 49, mid: 149, enterprise: 499 },
    mrr12mo: { optimistic: 15000, realistic: 8000, conservative: 3000 },
    arr12mo: { optimistic: 180000, realistic: 96000, conservative: 36000 },
    valuation12mo: { low: 288000, high: 1152000, multiple: '8-12x ARR' },
    monthsToBreakeven: 8,
    speedToExit: '18-24 months',
    gradingCriteria: {
      arrQuality: 8, churnAchievability: 7, founderDependenceInv: 9,
      ruleOf40Potential: 7, pricingPower: 8, marketTiming: 8,
      buildSpeed: 7, defensibility: 6, notes: {},
    },
    priorityScore: 7.4,
    priorityVerdict: 'solid',
    reasoning: 'Test',
    competitorNote: null,
    ...overrides,
  };
}

describe('allocateProjectPoints', () => {
  it('allocates 5000 base points for $50K-$200K ARR', () => {
    const result = allocateProjectPoints('TestProject', makeAnalysis());
    expect(result.basePoints).toBe(5000);
  });

  it('applies 1.0x multiplier for priority 6-7.9', () => {
    const result = allocateProjectPoints('TestProject', makeAnalysis({ priorityScore: 7.4 }));
    expect(result.multiplier).toBe(1.0);
    expect(result.totalPoints).toBe(5000);
  });

  it('applies 1.5x multiplier for priority 8+', () => {
    const result = allocateProjectPoints('TestProject', makeAnalysis({ priorityScore: 8.5 }));
    expect(result.multiplier).toBe(1.5);
    expect(result.totalPoints).toBe(7500);
  });

  it('applies 0.5x multiplier for priority <6', () => {
    const result = allocateProjectPoints('TestProject', makeAnalysis({ priorityScore: 4.0 }));
    expect(result.multiplier).toBe(0.5);
    expect(result.totalPoints).toBe(2500);
  });

  it('breaks down points by 7 roles summing to 100%', () => {
    const result = allocateProjectPoints('TestProject', makeAnalysis());
    expect(result.breakdown).toHaveLength(7);
    const totalPct = result.breakdown.reduce((sum, r) => sum + parseInt(r.percentage), 0);
    expect(totalPct).toBe(100);
  });

  it('has 8 milestones ending at 100%', () => {
    const result = allocateProjectPoints('TestProject', makeAnalysis());
    expect(result.milestonePoints).toHaveLength(8);
    const last = result.milestonePoints[result.milestonePoints.length - 1];
    expect(last.cumulativePct).toBe('100%');
    expect(last.cumulativePoints).toBe(result.totalPoints);
  });

  it('uses 500 base points for ARR < $10K', () => {
    const analysis = makeAnalysis({
      arr12mo: { optimistic: 9000, realistic: 5000, conservative: 2000 },
    });
    const result = allocateProjectPoints('Small', analysis);
    expect(result.basePoints).toBe(500);
  });

  it('uses 50000 base points for ARR $1M+', () => {
    const analysis = makeAnalysis({
      arr12mo: { optimistic: 2000000, realistic: 1200000, conservative: 800000 },
    });
    const result = allocateProjectPoints('Big', analysis);
    expect(result.basePoints).toBe(50000);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd ~/exitstorm && pnpm test
```

Expected: all tests pass (core + analyzer + allocator).

- [ ] **Step 3: Commit**

```bash
cd ~/exitstorm && git add packages/team-engine/test/ && git commit -m "test: add allocator points tests"
```

---

### Task 9: Add DB tests

**Files:**
- Create: `packages/db/test/db.test.ts`

- [ ] **Step 1: Write DB tests**

Create `packages/db/test/db.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContributionDB } from '../src/contribution-db.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { unlinkSync } from 'fs';

let db: ContributionDB;
let dbPath: string;

beforeEach(() => {
  dbPath = join(tmpdir(), `exitstorm-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  db = new ContributionDB(dbPath);
  db.init();
});

afterEach(() => {
  db.close();
  try { unlinkSync(dbPath); } catch { /* ignore */ }
});

describe('ContributionDB', () => {
  describe('members', () => {
    it('upserts and retrieves a member', () => {
      db.upsertMember('123', 'testuser', 'Test User');
      const member = db.getMember('123');
      expect(member).toBeDefined();
      expect(member!.username).toBe('testuser');
      expect(member!.display_name).toBe('Test User');
      expect(member!.total_points).toBe(0);
    });

    it('updates existing member on re-upsert', () => {
      db.upsertMember('123', 'old_name');
      db.upsertMember('123', 'new_name');
      const member = db.getMember('123');
      expect(member!.username).toBe('new_name');
    });

    it('links GitHub account', () => {
      db.upsertMember('123', 'testuser');
      db.linkGitHub('123', 'ghuser');
      const member = db.getMember('123');
      expect(member!.github_username).toBe('ghuser');
    });

    it('finds member by GitHub username', () => {
      db.upsertMember('123', 'testuser');
      db.linkGitHub('123', 'ghuser');
      const member = db.getMemberByGithub('ghuser');
      expect(member).toBeDefined();
      expect(member!.discord_id).toBe('123');
    });
  });

  describe('contributions', () => {
    it('adds a contribution and updates member points', () => {
      db.upsertMember('123', 'testuser');
      db.addContribution({
        memberId: '123',
        type: 'helpful_conversation',
        points: 10,
        source: 'ai_analysis',
      });
      const member = db.getMember('123');
      expect(member!.total_points).toBe(10);
    });

    it('retrieves contribution history', () => {
      db.upsertMember('123', 'testuser');
      db.addContribution({ memberId: '123', type: 'pr_merged', points: 20, source: 'github_webhook' });
      db.addContribution({ memberId: '123', type: 'pr_review', points: 10, source: 'github_webhook' });
      const history = db.getContributions('123');
      expect(history).toHaveLength(2);
      expect(history[0].points).toBe(10); // most recent first
    });

    it('returns point breakdown by type', () => {
      db.upsertMember('123', 'testuser');
      db.addContribution({ memberId: '123', type: 'pr_merged', points: 20, source: 'github_webhook' });
      db.addContribution({ memberId: '123', type: 'pr_merged', points: 15, source: 'github_webhook' });
      db.addContribution({ memberId: '123', type: 'pr_review', points: 10, source: 'github_webhook' });
      const breakdown = db.getPointBreakdown('123');
      const prMerged = breakdown.find(b => b.type === 'pr_merged');
      expect(prMerged!.count).toBe(2);
      expect(prMerged!.total_points).toBe(35);
    });
  });

  describe('leaderboard', () => {
    it('returns members sorted by total points', () => {
      db.upsertMember('a', 'alice');
      db.upsertMember('b', 'bob');
      db.addContribution({ memberId: 'a', type: 'pr_merged', points: 50, source: 'github_webhook' });
      db.addContribution({ memberId: 'b', type: 'pr_merged', points: 100, source: 'github_webhook' });
      const lb = db.getLeaderboard({ limit: 10 });
      expect(lb[0].username).toBe('bob');
      expect(lb[1].username).toBe('alice');
    });

    it('excludes bots', () => {
      db.upsertMember('bot1', 'botuser', null, true);
      db.addContribution({ memberId: 'bot1', type: 'pr_merged', points: 999, source: 'github_webhook' });
      const lb = db.getLeaderboard();
      expect(lb).toHaveLength(0);
    });
  });

  describe('vouching', () => {
    it('allows a valid vouch', () => {
      db.upsertMember('a', 'alice');
      db.upsertMember('b', 'bob');
      const check = db.canVouch('a', 'b');
      expect(check.allowed).toBe(true);
    });

    it('blocks self-vouch', () => {
      db.upsertMember('a', 'alice');
      const check = db.canVouch('a', 'a');
      expect(check.allowed).toBe(false);
    });

    it('awards points on vouch', () => {
      db.upsertMember('a', 'alice');
      db.upsertMember('b', 'bob');
      db.addVouch('a', 'b', 'great work');
      const bob = db.getMember('b');
      expect(bob!.total_points).toBe(5);
    });
  });

  describe('stats', () => {
    it('returns system stats', () => {
      db.upsertMember('a', 'alice');
      db.addContribution({ memberId: 'a', type: 'pr_merged', points: 10, source: 'github_webhook' });
      const stats = db.getStats();
      expect(stats.members).toBe(1);
      expect(stats.contributions).toBe(1);
      expect(stats.totalPoints).toBe(10);
    });
  });

  describe('github events', () => {
    it('tracks and deduplicates events', () => {
      db.upsertMember('a', 'alice');
      expect(db.hasGithubEvent('pr_merged:arc-web/exitstorm:1')).toBe(false);
      db.recordGithubEvent({
        event_id: 'pr_merged:arc-web/exitstorm:1',
        event_type: 'pr_merged',
        repo: 'arc-web/exitstorm',
        github_author: 'alice',
        discord_id: 'a',
        points_awarded: 20,
        dry_run: false,
      });
      expect(db.hasGithubEvent('pr_merged:arc-web/exitstorm:1')).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd ~/exitstorm && pnpm test
```

Expected: all tests pass (core + analyzer + allocator + db).

- [ ] **Step 3: Commit**

```bash
cd ~/exitstorm && git add packages/db/test/ && git commit -m "test: add DB CRUD and migration tests"
```

---

### Task 10: Update README for new usage model

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite README for agent-first usage**

Replace the entire README with content reflecting the actual usage model: AI agents read the repo and call the packages directly. Remove Discord bot setup, slash commands, web dashboard sections. Keep the architecture, scoring system, and package docs. Update Quick Start to show `pnpm install && pnpm build && pnpm test`. Add a "Usage" section showing how to call `analyzeProject()` and `allocateProjectPoints()` programmatically plus the CLI entry point.

Key sections to keep/adapt:
- What is ExitStorm (updated pitch)
- Architecture diagram (remove apps, keep packages)
- Packages table
- Scoring system (contribution types, priority scoring, points allocation, milestones, levels)
- Quick Start (install, build, test, analyze)
- License

- [ ] **Step 2: Commit**

```bash
cd ~/exitstorm && git add README.md && git commit -m "docs: rewrite README for agent-first usage model"
```

---

### Task 11: Clean up ExitStorm.md and docs

**Files:**
- Modify: `ExitStorm.md`, `docs/CONTRIBUTING.md`, `docs/ARCHITECTURE.md`

- [ ] **Step 1: Update ExitStorm.md**

Remove references to Discord slash commands, voting polls, and the old pipeline flow that assumed Discord as the interface. Keep the financial modeling framework, scoring criteria, role allocation, and milestone system - these are the core value.

- [ ] **Step 2: Update ARCHITECTURE.md**

Remove the `@exitstorm/discord-bot`, `@exitstorm/web`, and `@exitstorm/api` sections from the dependency graph and package details. Update the data flow section to show direct function calls instead of Discord command flows.

- [ ] **Step 3: Update CONTRIBUTING.md**

Remove Discord-specific contribution types (helpful_conversation via AI analysis, etc.) and Discord bot setup instructions. Keep the code contribution workflow and monorepo structure guide.

- [ ] **Step 4: Commit**

```bash
cd ~/exitstorm && git add ExitStorm.md docs/ && git commit -m "docs: update docs for agent-first architecture"
```

---

### Task 12: Final verification

- [ ] **Step 1: Clean build from scratch**

```bash
cd ~/exitstorm && pnpm clean && pnpm install && pnpm build
```

Expected: clean build, no errors.

- [ ] **Step 2: Run full test suite**

```bash
cd ~/exitstorm && pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Verify no old references remain**

```bash
cd ~/exitstorm && grep -ri "openclaw\|signet\|busybee\|localbosses\|clawdbot" --include="*.ts" --include="*.json" --include="*.md" --include="*.yml" .
```

Expected: zero matches.

- [ ] **Step 4: Verify the CLI works (if API key available)**

```bash
cd ~/exitstorm && ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npx tsx packages/analyzer/src/cli.ts "AdLens" "AI-powered ad optimization platform for SMB advertisers"
```

Expected: JSON output with full ProjectAnalysis + PointsAllocation.

- [ ] **Step 5: Commit any remaining changes**

```bash
cd ~/exitstorm && git add -A && git status
```

If clean, we're done. If changes remain, commit them.
