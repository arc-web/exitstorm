# ExitStorm
### Idea Analysis and Exit Pipeline Engine

> **The pitch:** A tool that takes raw project ideas -> financial model -> team assignment -> build pipeline -> exit. Every contributor earns based on what they put in. No VCs. No gatekeepers. Stake your contribution, earn on exit.

---

## What Is ExitStorm?

ExitStorm is a pipeline engine for analyzing, staffing, and tracking micro-SaaS products through to exit. AI agents read the codebase on GitHub and call the package functions directly - no Discord bot or UI required.

The three laws of ExitStorm:
1. **If you contribute, you earn.** Every PR, review, tool share, or code contribution gets tracked and scored.
2. **Every idea gets a financial model.** No more "that sounds cool" - every proposal gets ARR projections, valuation, and a priority score automatically.
3. **Exit is the goal.** Not building forever. Build -> hit target ARR -> exit on Flippa/Acquire.com -> distribute.

---

## The Stack (What's Built)

### Layer 1 - Contribution Tracking
The contribution system tracks:
- Helpful conversations, teaching moments, tool shares
- PR merges and code reviews (GitHub-linked)
- Idea impact scores
- Peer vouches

Every action earns points. Points determine your % of project allocation.

### Layer 2 - SaaS Pricing Framework
When evaluating any idea, the system applies a consistent financial model:

**Classification:**
| Dimension | Options |
|-----------|---------|
| App Type | B2B SaaS / B2C SaaS / Mobile / API / Marketplace |
| Market | Consumer / SMB / Mid-market / Enterprise |
| Mechanism | Subscription / Freemium / Usage-based / One-time / Hybrid |
| Time-to-value | Immediate / Needs setup / Needs repeated use |

**Revenue modeling:**
- Entry price recommendation (based on market + mechanism)
- 12-month MRR: conservative / realistic / optimistic
- 12-month ARR
- Valuation range: B2B AI = 8-12x ARR · B2C = 3-5x · Micro-SaaS = 2.5-4.5x SDE
- Months to breakeven

### Layer 3 - Priority Scoring (8 Criteria)
Every idea gets scored 0-10 across 8 dimensions:

| Criterion | Weight | What It Measures |
|-----------|--------|-----------------|
| ARR Quality | 15% | Recurring, predictable revenue |
| Churn Achievability | 10% | How sticky is the product? |
| Founder Independence | 10% | Can it run without the builder? |
| Rule of 40 Potential | 15% | Growth + margin headroom |
| Pricing Power | 10% | Can you raise prices over time? |
| Market Timing | 10% | Is the window open right now? |
| Build Speed | 15% | How fast can we ship an MVP? |
| Defensibility | 15% | What's the moat? |

**Verdicts:** <5 skip · 5-7 queue · 7-8 solid · 8+ build first

### Layer 4 - Financial Modeling Graphics (Auto-Generated)
Analysis generates 3 AI images:
1. **Pricing Model Chart** - tier structure + MRR projections
2. **Path to Exit Timeline** - launch -> breakeven -> ARR target -> exit window
3. **Competitor Landscape** - 2x2 positioning matrix

Generated via `generateProjectGraphics()` in `@exitstorm/graphics`.

### Layer 5 - Dynamic Team Assignment
When a project is analyzed, the system:
1. Identifies required roles based on project type
2. Scans contribution DB for best-matched members
3. Assigns roles to top contributors in each category
4. Marks unfilled roles as "Open - community recruitment"

Role matching by contribution type:
- `pr_merged` / `pr_review` -> Backend Engineer, Lead Builder
- `tool_share` -> Frontend Dev, DevOps
- `idea_impact` -> Product, Growth
- `helpful_conversation` -> Community Manager, Support

### Layer 6 - Contribution Points by Valuation
Points available on a project scale with its realistic ARR:

| Realistic 12mo ARR | Base Points |
|-------------------|-------------|
| < $10K | 500 |
| $10K-$50K | 1,500 |
| $50K-$200K | 5,000 |
| $200K-$1M | 15,000 |
| $1M+ | 50,000 |

Modified by priority score (8-10 = 1.5x · <6 = 0.5x)

**Role allocation:**
- Lead Builder: 35% · Co-Builder: 20% · Designer: 15%
- QA: 10% · Growth: 10% · Community: 5% · Docs/PM: 5%

**Milestone unlocks (cumulative):**
- Kickoff: 5% -> MVP shipped: 20% -> First customer: 35% -> $1K MRR: 50% -> $5K MRR: 65% -> Breakeven: 80% -> Target ARR: 95% -> Exit: 100%

---

## The ExitStorm Pipeline

```
IDEA INPUT (title + description)
        |
        v
analyzeProject() - calls AI provider
        |
        v
ProjectAnalysis (ARR · Valuation · Priority Score · 8 criteria)
        |
        v
generateProjectGraphics() - 3 AI images (Pricing · Timeline · Landscape)
        |
        v
recommendTeam() - scans contribution DB, matches roles
        |
        v
allocateProjectPoints() - total points, role breakdown, milestone schedule
        |
        v
APPROVED -> Project enters build queue
        |
        v
Milestone tracking begins -> points unlock progressively
        |
        v
ARR target hit -> LIST ON FLIPPA / ACQUIRE.COM
        |
        v
Exit proceeds distributed proportional to contribution points
```

---

*ExitStorm - Built by Advertising Report Card - March 2026*
