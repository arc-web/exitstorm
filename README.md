<div align="center">

# ⚡ ExitStorm

### Community-Powered Micro-SaaS Exit Machine

[![CI](https://github.com/openclaw/exitstorm/actions/workflows/ci.yml/badge.svg)](https://github.com/openclaw/exitstorm/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Discord](https://img.shields.io/badge/Discord-OpenClaw-7289da.svg)](https://discord.gg/openclaw)

**Take raw ideas from a Discord community → financial model → team assignment → build pipeline → Flippa exit.**

Every contributor earns based on what they put in. No VCs. No gatekeepers. Stake your contribution, earn on exit.

</div>

---

## What is ExitStorm?

ExitStorm is an operating system for building and exiting micro-SaaS products as a community. It lives inside Discord, tracks everything automatically, and turns ideas into real exits.

**The three laws of ExitStorm:**

1. **If you contribute, you earn.** Every helpful message, PR, tool share, or code review gets tracked and scored.
2. **Every idea gets a financial model.** No more "that sounds cool" — every proposal gets ARR projections, valuation ranges, and a priority score automatically.
3. **Exit is the goal.** Not building forever. Build → hit target ARR → exit on Flippa/Acquire.com → distribute proceeds to contributors.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ExitStorm Monorepo                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │ Discord  │  │   Web    │  │   REST   │         apps/            │
│  │   Bot    │  │Dashboard │  │   API    │                          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                         │
│       │              │              │                               │
│  ─────┼──────────────┼──────────────┼────────────────────────       │
│       │              │              │                               │
│  ┌────┴─────┐  ┌─────┴────┐  ┌─────┴─────┐  ┌──────────┐         │
│  │ Analyzer │  │ Graphics │  │Team Engine │  │   Core   │ pkgs/   │
│  │ (AI fin. │  │ (AI img  │  │(matching + │  │ (types,  │         │
│  │  models) │  │  gen)    │  │  points)   │  │  utils)  │         │
│  └────┬─────┘  └──────────┘  └─────┬─────┘  └──────────┘         │
│       │                            │                               │
│  ─────┼────────────────────────────┼────────────────────────       │
│       │                            │                               │
│  ┌────┴────────────────────────────┴─────┐                         │
│  │              Database (SQLite)         │         packages/db    │
│  │     Members · Contributions · Projects │                        │
│  │     Votes · Vouches · Streaks · Tasks  │                        │
│  └───────────────────────────────────────┘                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## The Pipeline

```
IDEA SURFACES IN DISCORD
        ↓
Contribution points awarded for discussion quality
        ↓
/proposeproject — triggers auto-analysis
        ↓
📊 Financial Analysis Embed (ARR · Valuation · Priority Score)
        ↓
🎨 3 Auto-Generated Graphics (Pricing · Timeline · Landscape)
        ↓
👥 Team Assignment Embed (matched contributors + open roles)
        ↓
Community Vote (24hr poll — 60% yes + 50% participation)
        ↓
✅ APPROVED → Project enters build queue
        ↓
GitHub repo created → milestone tracking begins
        ↓
Points unlock at each milestone (5% → 20% → 35% → ... → 100%)
        ↓
🎯 ARR target hit → LIST ON FLIPPA / ACQUIRE.COM
        ↓
💰 Exit proceeds distributed proportional to contribution points
```

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Discord Bot Token** ([Discord Developer Portal](https://discord.com/developers/applications))

### Setup

```bash
# Clone the repo
git clone https://github.com/openclaw/exitstorm.git
cd exitstorm

# Install dependencies
pnpm install

# Copy environment files
cp apps/discord-bot/.env.example apps/discord-bot/.env

# Edit .env with your tokens
# BOT_TOKEN=your_discord_bot_token
# OPENAI_API_KEY=your_openai_key (for financial analysis)

# Build all packages
pnpm build

# Start the Discord bot
pnpm --filter @exitstorm/discord-bot dev
```

### Development

```bash
# Run all packages in dev mode
pnpm dev

# Type-check everything
pnpm typecheck

# Lint
pnpm lint

# Run database migrations
pnpm --filter @exitstorm/db migrate
```

## Packages

| Package | Description | Key Exports |
|---------|-------------|-------------|
| `@exitstorm/core` | Shared types, constants, and utilities | `ProjectAnalysis`, `Member`, `Contribution`, scoring constants |
| `@exitstorm/analyzer` | AI-powered financial analysis engine | `analyzeProject()`, `computePriorityScore()`, `priorityVerdict()` |
| `@exitstorm/graphics` | AI image generation for project visuals | `generateProjectGraphics()` |
| `@exitstorm/team-engine` | Contributor matching + points allocation | `recommendTeam()`, `allocateProjectPoints()` |
| `@exitstorm/db` | SQLite database layer with migrations | `ContributionDB`, query helpers, migration runner |

## Apps

| App | Description | Tech |
|-----|-------------|------|
| `@exitstorm/discord-bot` | Main Discord bot with slash commands | discord.js, discordjs-react, TSX |
| `@exitstorm/web` | Dashboard for projects & leaderboards | Next.js 14, Tailwind CSS |
| `@exitstorm/api` | REST API for external integrations | Hono, Zod validation |

## Scoring System

### Contribution Types

| Type | Source | Base Points |
|------|--------|-------------|
| `helpful_conversation` | AI analysis | 5-15 |
| `teaching_moment` | AI analysis | 8-20 |
| `tool_share` | AI analysis | 5-10 |
| `pr_merged` | GitHub webhook | 15-30 |
| `pr_review` | GitHub webhook | 10-20 |
| `peer_vouch` | `/vouch` command | 5 |
| `challenge_completed` | Bounty system | Variable |
| `streak_bonus` | Daily activity | 3-30 |

### Priority Scoring (8 Criteria)

Every proposed project is scored 0-10 across 8 weighted dimensions:

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

**Verdicts:** <5 skip · 5-7 queue · 7-8 solid · 8+ build first 🔥

### Points Allocation by Project

Points scale with the project's realistic ARR projection:

| Realistic 12mo ARR | Base Points | With 8+ Priority (1.5x) |
|-------------------|-------------|-------------------------|
| < $10K | 500 | 750 |
| $10K–$50K | 1,500 | 2,250 |
| $50K–$200K | 5,000 | 7,500 |
| $200K–$1M | 15,000 | 22,500 |
| $1M+ | 50,000 | 75,000 |

### Milestone Unlocks

Points unlock progressively as the project hits milestones:

```
Kickoff (5%) → MVP (20%) → First Customer (35%) → $1K MRR (50%)
→ $5K MRR (65%) → Breakeven (80%) → Target ARR (95%) → Exit (100%)
```

## Levels

| Level | Name | Min Points | Emoji |
|-------|------|-----------|-------|
| 1 | Newcomer | 0 | (._. ) |
| 2 | Participant | 50 | ( ._.) |
| 3 | Contributor | 200 | (o_o ) |
| 4 | Regular | 500 | ( ^_^) |
| 5 | Champion | 1,000 | (*_* ) |
| 6 | Legend | 2,500 | (!!!) |
| 7 | Architect | 5,000 | (GOD) |

## Bot Commands

| Command | Description | Visibility |
|---------|-------------|------------|
| `/leaderboard` | Contribution leaderboard | Public |
| `/mypoints` | Your profile & stats | Ephemeral |
| `/profile @user` | Another member's profile | Public |
| `/history` | Full contribution audit log | Public/Ephemeral |
| `/stats` | System-wide statistics | Public |
| `/vouch @user` | Vouch for a member (+5 pts) | Ephemeral |
| `/linkgithub` | Link your GitHub account | Ephemeral |
| `/projects` | Browse community projects | Public |
| `/proposeproject` | Propose a new project | Public (poll) |
| `/addtask` | Add task to a project (admin) | Ephemeral |

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

**TL;DR:**
1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run `pnpm typecheck && pnpm lint`
5. Open a PR

### Adding a New Analyzer Plugin

ExitStorm supports custom analyzers. Create a new package:

```bash
mkdir -p packages/my-analyzer/src
```

Implement the `AnalyzerPlugin` interface from `@exitstorm/core`:

```typescript
import type { AnalyzerPlugin, ProjectAnalysis } from '@exitstorm/core';

export const myAnalyzer: AnalyzerPlugin = {
  name: 'my-analyzer',
  version: '1.0.0',
  analyze: async (title, description) => {
    // Your analysis logic
    return { /* ProjectAnalysis */ };
  },
};
```

## Project Structure

```
exitstorm/
├── apps/
│   ├── discord-bot/        # Main Discord bot (slash commands, React UIs)
│   ├── web/                # Next.js dashboard (projects, leaderboard)
│   └── api/                # Hono REST API
├── packages/
│   ├── core/               # Shared types, constants, utilities
│   ├── analyzer/           # AI financial analysis engine
│   ├── graphics/           # AI image generation
│   ├── team-engine/        # Contributor matching + points allocation
│   └── db/                 # SQLite database + migrations
├── scripts/                # Deployment, migration, setup scripts
├── docs/                   # Architecture & contribution docs
├── turbo.json              # Turborepo pipeline config
├── pnpm-workspace.yaml     # pnpm workspace config
└── package.json            # Root package.json
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built on the [OpenClaw](https://discord.gg/openclaw) Discord · Powered by [Signet](https://github.com/openclaw/signet)**

*ExitStorm — March 2026*

</div>
