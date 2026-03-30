<div align="center">

# ExitStorm

### Idea Analysis and Exit Pipeline Engine

[![CI](https://github.com/arc-web/exitstorm/actions/workflows/ci.yml/badge.svg)](https://github.com/arc-web/exitstorm/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## What is ExitStorm?

ExitStorm takes project ideas and produces financial models, priority scores, team recommendations, and points allocations. It is designed for use by AI agents that read the codebase on GitHub and call the package functions directly - no Discord bot, no web UI, no API server required.

**What it does:**

1. **Financial modeling.** Every idea gets ARR projections, valuation ranges, and a priority score across 8 weighted criteria.
2. **Team matching.** Matches contributors to project roles based on contribution history and role affinity scores.
3. **Points allocation.** Calculates total project points by ARR tier, applies a priority multiplier, and breaks down unlocks by milestone.

---

## Architecture

Five packages. No apps layer. Agents call the packages directly.

```
                    +--------------+
                    | @exitstorm   |
                    |   /core      |  <- types, constants, utils
                    +------+-------+
                           |
           +---------------+---------------+
           |               |               |
    +------+------+ +------+------+ +------+-------+
    | @exitstorm  | | @exitstorm  | | @exitstorm   |
    | /analyzer   | | /graphics   | | /team-engine |
    +------+------+ +------+------+ +------+-------+
           |               |               |
           |               |        +------+-------+
           |               |        | @exitstorm   |
           |               |        |    /db       |
           |               |        +------+-------+
           |               |               |
           +---------------+---------------+
                    (agent calls directly)
```

**Dependency rules:** `core` has no internal deps. `analyzer` and `graphics` depend only on `core`. `team-engine` depends on `core` and `db`. `db` depends on `core`.

---

## Quick Start

```bash
# Install and build
pnpm install
pnpm build
pnpm test
```

### CLI usage

```bash
# Analyze a project idea
node packages/analyzer/dist/cli.js "AdLens" "AI-powered ad optimization for SMBs"

# Allocate points for an approved project
node packages/team-engine/dist/cli.js allocate --arr 85000 --priority 8.2
```

### Programmatic usage

```typescript
import { analyzeProject } from '@exitstorm/analyzer';
import { allocateProjectPoints } from '@exitstorm/team-engine';

// Run financial analysis
const analysis = await analyzeProject('AdLens', 'AI-powered ad optimization for SMBs');
console.log(analysis.priorityScore); // 0-10
console.log(analysis.arr.realistic); // projected ARR

// Calculate points allocation
const allocation = allocateProjectPoints(analysis);
console.log(allocation.totalPoints);
console.log(allocation.milestones);
```

---

## Packages

| Package | Description | Key Exports |
|---------|-------------|-------------|
| `@exitstorm/core` | Shared types, constants, and utilities | `ProjectAnalysis`, `Member`, `Contribution`, scoring constants |
| `@exitstorm/analyzer` | AI financial analysis engine | `analyzeProject()`, `computePriorityScore()`, `priorityVerdict()` |
| `@exitstorm/team-engine` | Contributor matching and points allocation | `recommendTeam()`, `allocateProjectPoints()` |
| `@exitstorm/graphics` | AI image generation for project visuals | `generateProjectGraphics()` |
| `@exitstorm/db` | SQLite database layer with migrations | `ContributionDB`, query helpers, migration runner |

---

## Scoring System

### Contribution Types

| Type | Source | Base Points |
|------|--------|-------------|
| `helpful_conversation` | AI analysis | 5-15 |
| `teaching_moment` | AI analysis | 8-20 |
| `tool_share` | AI analysis | 5-10 |
| `pr_merged` | GitHub webhook | 15-30 |
| `pr_review` | GitHub webhook | 10-20 |
| `peer_vouch` | Direct call | 5 |
| `challenge_completed` | Bounty system | Variable |
| `streak_bonus` | Daily activity | 3-30 |

### Priority Scoring (8 Criteria)

Every project is scored 0-10 across 8 weighted dimensions:

| Criterion | Weight | What It Measures |
|-----------|--------|-----------------|
| ARR Quality | 15% | Recurring, predictable revenue |
| Churn Achievability | 10% | Product stickiness |
| Founder Independence | 10% | Automation level |
| Rule of 40 Potential | 15% | Growth + margin headroom |
| Pricing Power | 10% | Ability to raise prices |
| Market Timing | 10% | Window opportunity |
| Build Speed | 15% | Time to MVP |
| Defensibility | 15% | Competitive moat |

**Verdicts:** <5 skip · 5-7 queue · 7-8 solid · 8+ build first

### Points Allocation by Project

Points scale with the project's realistic ARR projection:

| Realistic 12mo ARR | Base Points | With 8+ Priority (1.5x) |
|-------------------|-------------|-------------------------|
| < $10K | 500 | 750 |
| $10K-$50K | 1,500 | 2,250 |
| $50K-$200K | 5,000 | 7,500 |
| $200K-$1M | 15,000 | 22,500 |
| $1M+ | 50,000 | 75,000 |

### Milestone Unlocks

Points unlock progressively as the project hits milestones:

```
Kickoff (5%) -> MVP (20%) -> First Customer (35%) -> $1K MRR (50%)
-> $5K MRR (65%) -> Breakeven (80%) -> Target ARR (95%) -> Exit (100%)
```

### Levels

| Level | Name | Min Points |
|-------|------|-----------|
| 1 | Newcomer | 0 |
| 2 | Participant | 50 |
| 3 | Contributor | 200 |
| 4 | Regular | 500 |
| 5 | Champion | 1,000 |
| 6 | Legend | 2,500 |
| 7 | Architect | 5,000 |

---

## Plugin System

ExitStorm supports custom analyzers via the `AnalyzerPlugin` interface from `@exitstorm/core`:

```typescript
import type { AnalyzerPlugin, ProjectAnalysis } from '@exitstorm/core';

export const myAnalyzer: AnalyzerPlugin = {
  name: 'my-analyzer',
  version: '1.0.0',
  analyze: async (title, description) => {
    // Your analysis logic
    return { /* Partial<ProjectAnalysis> */ };
  },
};
```

---

## Project Structure

```
exitstorm/
├── packages/
│   ├── core/               # Shared types, constants, utilities
│   ├── analyzer/           # AI financial analysis engine
│   ├── graphics/           # AI image generation
│   ├── team-engine/        # Contributor matching + points allocation
│   └── db/                 # SQLite database + migrations
├── scripts/                # Migration and setup scripts
├── docs/                   # Architecture and contribution docs
├── turbo.json              # Turborepo pipeline config
├── pnpm-workspace.yaml     # pnpm workspace config
└── package.json            # Root package.json
```

---

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

## License

MIT - see [LICENSE](LICENSE) for details.

Built by [Advertising Report Card](https://github.com/arc-web)
