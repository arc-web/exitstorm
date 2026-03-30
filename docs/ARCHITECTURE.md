# ExitStorm Architecture

## System Overview

ExitStorm is a Turborepo monorepo with 5 internal packages. All code is TypeScript (strict mode). The data layer is SQLite via better-sqlite3. There is no apps layer - AI agents call the packages directly.

## Dependency Graph

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

## Package Details

### `@exitstorm/core`
**Purpose:** Single source of truth for types, constants, and utility functions.

- **Types:** `Member`, `Contribution`, `ProjectAnalysis`, `TeamRecommendation`, `PointsAllocation`, `AnalyzerPlugin`
- **Constants:** Level definitions, priority score weights, role breakdowns, ARR point tiers, contribution-role affinity mappings
- **Utils:** `getLevelInfo()`, `computePriorityScore()`, `priorityVerdict()`, `formatCurrency()`, `slugify()`
- **Zero runtime dependencies** (only `zod` for validation schemas)

### `@exitstorm/analyzer`
**Purpose:** AI-powered financial analysis engine.

- Calls Anthropic Claude (haiku) or OpenAI gpt-4o-mini
- Provider cascade: Anthropic classic key -> OpenAI fallback
- Prompt engineering for 8-criteria scoring + financial modeling
- Deterministic priority score computation (weights are in `@exitstorm/core`)
- **Key export:** `analyzeProject(title, description, existingProjects?)`
- **Plugin interface:** `AnalyzerPlugin` for custom analysis modules

### `@exitstorm/graphics`
**Purpose:** AI image generation for project visualizations.

- Generates 3 images per project: pricing chart, exit timeline, competitor landscape
- Uses external image generation script (configurable path)
- Never throws - returns partial results on failure
- **Key export:** `generateProjectGraphics(title, analysis, options?)`

### `@exitstorm/team-engine`
**Purpose:** Contributor matching and points allocation.

Two sub-modules:
1. **Recommender** - matches community members to project roles based on contribution history and role affinity scores
2. **Allocator** - calculates total project points based on ARR, applies priority multiplier, breaks down by role % and milestone unlock schedule

- **Key exports:** `recommendTeam()`, `allocateProjectPoints()`

### `@exitstorm/db`
**Purpose:** SQLite database layer with migration support.

- `ContributionDB` class wrapping better-sqlite3
- Typed query helpers for all tables
- Migration runner (reads numbered `.sql` files, tracks applied migrations in `_migrations` table)
- Full schema: members, contributions, vouches, projects, tasks, streaks, challenges, analysis runs, GitHub events, decay log, reaction tracking

## Data Flow

### Project Analysis Flow

```
Agent calls analyzeProject("AdLens", "AI ad optimization...")
    |
    +-> [1] AI provider call (Anthropic or OpenAI fallback)
    |   +-> Returns ProjectAnalysis (ARR, valuation, 8 criteria, priority score)
    |
    +-> [2] generateProjectGraphics() creates 3 images
    |   +-> pricing chart, exit timeline, competitor landscape
    |
    +-> [3] recommendTeam() scans contribution DB
    |   +-> Matches top contributors to needed roles by affinity score
    |
    +-> [4] allocateProjectPoints() calculates incentives
        +-> Total points, role breakdown, milestone unlock schedule
```

### Contribution Scoring Flow

```
Contribution input (PR event, direct call, analysis result)
    |
    +-> Score computation via contribution type + weights
    +-> Writes to contributions table
    +-> Recalculates member points
    +-> Checks for level-up
```

## Database Schema

See `packages/db/src/migrations/001_initial.sql` for the complete schema.

Key tables:
- **members** - users with cross-platform identity, points, levels
- **contributions** - All scored contributions with type, points, evidence
- **community_projects** - Projects with analysis JSON and approval status
- **project_tasks** - Tasks within approved projects
- **vouches** - Peer-to-peer vouching system
- **github_events** - Deduped GitHub webhook events
- **member_streaks** - Daily activity streak tracking
- **analysis_runs** - AI analysis cost tracking and dedup

## Plugin System

The `AnalyzerPlugin` interface in `@exitstorm/core` allows custom analyzers:

```typescript
interface AnalyzerPlugin {
  name: string;
  version: string;
  analyze: (title, description, existing?) => Promise<Partial<ProjectAnalysis>>;
}
```

Plugins can augment or replace the default AI analysis. Future: plugin registry, composable analysis pipelines.

## Security Considerations

- **API keys** are never stored in the DB - loaded from environment variables
- **Vouch anti-gaming:** 3/day cap, 1/week per recipient, can't self-vouch
- **Contribution caps:** Daily point limits scale with member level
- **Reaction anti-gaming:** UNIQUE constraint on (message, reactor, emoji)
- **Bot detection:** `is_bot` flag on members, excluded from leaderboards
