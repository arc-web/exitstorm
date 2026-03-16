# Contributing to ExitStorm

Thanks for your interest in ExitStorm! This document covers how to get involved.

## Ways to Contribute

### 1. Code Contributions

- **Bug fixes** — Found something broken? Fix it and open a PR.
- **New features** — Check the issues for `good first issue` or `help wanted` labels.
- **Analyzer plugins** — Build a custom analyzer that adds new scoring dimensions.
- **Tests** — We need more test coverage everywhere.

### 2. Community Contributions

These are tracked automatically in our Discord and earn contribution points:

- **Helpful conversations** — Answer questions, share knowledge
- **Teaching moments** — Explain concepts to others
- **Tool shares** — Share useful tools, libraries, resources
- **Idea proposals** — Use `/proposeproject` to propose new micro-SaaS ideas
- **Peer vouching** — Vouch for other contributors with `/vouch`

### 3. Documentation

- Improve this file
- Add API documentation
- Write guides for common workflows
- Fix typos (yes, really — every contribution counts)

## Development Setup

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9
- A Discord bot token (for testing the bot)

### Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/exitstorm.git
cd exitstorm

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run type checks
pnpm typecheck
```

### Running the Bot Locally

```bash
# Copy env template
cp apps/discord-bot/.env.example apps/discord-bot/.env
# Edit .env with your bot token

# Start in dev mode (with hot reload)
pnpm bot:dev
```

### Running the API

```bash
pnpm api:dev
# → http://localhost:3001
```

### Running the Web Dashboard

```bash
pnpm web:dev
# → http://localhost:3000
```

## Code Style

- **TypeScript strict mode** everywhere
- **ESM modules** (no CommonJS)
- All types live in `@exitstorm/core` — don't duplicate type definitions
- Use the shared utilities from `@exitstorm/core` (formatCurrency, slugify, etc.)

## Pull Request Process

1. **Fork** the repo and create your branch from `main`
2. **Make your changes** — keep PRs focused on a single concern
3. **Run checks:**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm build
   ```
4. **Open a PR** with a clear description of what and why
5. **Wait for review** — maintainers will review within a few days

### PR Title Format

Use conventional commits:
- `feat: add market size analyzer plugin`
- `fix: correct ARR calculation for usage-based pricing`
- `docs: add API endpoint documentation`
- `refactor: extract team recommender scoring logic`

## Monorepo Structure

When making changes, understand which package your code belongs in:

| I'm working on... | Package |
|---|---|
| Types, constants, shared utils | `packages/core` |
| Financial analysis, AI scoring | `packages/analyzer` |
| Image generation | `packages/graphics` |
| Team matching, points | `packages/team-engine` |
| Database queries, schema | `packages/db` |
| Discord slash commands | `apps/discord-bot` |
| Web dashboard UI | `apps/web` |
| REST API endpoints | `apps/api` |

### Adding a New Package

```bash
mkdir -p packages/my-package/src
# Create package.json with @exitstorm/my-package name
# Add @exitstorm/core as a dependency
# Export from src/index.ts
```

## Contribution Points

Code contributions to this repo earn ExitStorm contribution points:

| Action | Points |
|--------|--------|
| PR merged (bug fix) | 15 |
| PR merged (feature) | 20-30 |
| PR review | 10-20 |
| Bug report with repro | 10 |
| Documentation PR | 10 |

Points are tracked automatically via GitHub webhook integration.

## Questions?

- **Discord:** Join the [OpenClaw](https://discord.gg/openclaw) server
- **Issues:** Open a GitHub issue for bugs or feature requests
- **Discussions:** Use GitHub Discussions for architecture questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
