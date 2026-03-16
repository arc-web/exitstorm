# ExitStorm
### Community-Powered Micro-SaaS Exit Machine

> **The pitch:** A Discord-native system that takes raw ideas from conversation → financial model → team assignment → build pipeline → exit. Every contributor earns based on what they put in. No VCs. No gatekeepers. Stake your contribution, earn on exit.

---

## What Is ExitStorm?

ExitStorm is an operating system for building and exiting micro-SaaS products as a community. It lives inside Discord, tracks everything automatically, and turns ideas into real exits.

The three laws of ExitStorm:
1. **If you contribute, you earn.** Every helpful message, PR, tool share, or code review gets tracked.
2. **Every idea gets a financial model.** No more "that sounds cool" — every proposal gets ARR projections, valuation, and a priority score automatically.
3. **Exit is the goal.** Not building forever. Build → hit target ARR → exit on Flippa/Acquire.com → distribute.

---

## The Stack (What's Built)

### Layer 1 — Contribution Tracking
The contribution system already running in this Discord server. Tracks:
- Helpful conversations, teaching moments, tool shares
- PR merges and code reviews (GitHub-linked)
- Idea impact scores
- Reaction bonuses and peer vouches

Every action earns points. Points determine your % of project allocation.

### Layer 2 — SaaS Pricing Framework
When evaluating any idea, we apply a consistent financial model:

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

### Layer 3 — Priority Scoring (8 Criteria)
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

### Layer 4 — Financial Modeling Graphics (Auto-Generated)
Every `/proposeproject` auto-generates 3 AI images:
1. **Pricing Model Chart** — tier structure + MRR projections
2. **Path to Exit Timeline** — launch → breakeven → ARR target → exit window
3. **Competitor Landscape** — 2x2 positioning matrix

### Layer 5 — Dynamic Team Assignment
When a project is proposed, the system:
1. Identifies required roles based on project type
2. Scans contribution DB for best-matched community members
3. Assigns roles to top contributors in each category
4. Marks unfilled roles as "Open — community recruitment"

Role matching by contribution type:
- `pr_merged` / `pr_review` → Backend Engineer, Lead Builder
- `tool_share` → Frontend Dev, DevOps
- `idea_impact` → Product, Growth
- `helpful_conversation` → Community Manager, Support

### Layer 6 — Contribution Points by Valuation
Points available on a project scale with its realistic ARR:

| Realistic 12mo ARR | Base Points |
|-------------------|-------------|
| < $10K | 500 |
| $10K–$50K | 1,500 |
| $50K–$200K | 5,000 |
| $200K–$1M | 15,000 |
| $1M+ | 50,000 |

Modified by priority score (8-10 = 1.5x · <6 = 0.5x)

**Role allocation:**
- Lead Builder: 35% · Co-Builder: 20% · Designer: 15%
- QA: 10% · Growth: 10% · Community: 5% · Docs/PM: 5%

**Milestone unlocks (cumulative):**
- Kickoff: 5% → MVP shipped: 20% → First customer: 35% → $1K MRR: 50% → $5K MRR: 65% → Breakeven: 80% → Target ARR: 95% → Exit: 100%

---

## The ExitStorm Pipeline

```
IDEA SURFACES IN DISCORD
        ↓
Contribution points awarded for discussion quality
        ↓
/proposeproject — triggers auto-analysis
        ↓
📊 Financial Analysis Embed (ARR · Valuation · Score)
        ↓
🎨 3 Auto-Generated Graphics (Pricing · Timeline · Landscape)
        ↓
👥 Team Assignment Embed (matched contributors + open roles)
        ↓
Community Vote (48hr poll)
        ↓
✅ APPROVED → Project enters build queue
        ↓
GitHub repo created → milestone tracking begins
        ↓
Points unlock at each milestone
        ↓
🎯 ARR target hit → LIST ON FLIPPA / ACQUIRE.COM
        ↓
💰 Exit proceeds distributed proportional to contribution points
```

---

## Current Team Scorecard

| Member | Points | PRs | Ideas | Role |
|--------|--------|-----|-------|------|
| Nicholai | 659 | 9 | 0 | Lead Builder |
| Jake | 327 | 0 | 1 | Product / Ops |
| Mike | 252 | 0 | 10 | Strategy / Ideas |
| Jacob | 141 | 0 | 1 | Participant |
| + 14 others | <30 | 0 | 0 | Developing |

**Build capacity: 1 active builder.** Target: 6-8 builders for 2 exits/month.

---

## Current Idea Pipeline (Scored)

| Rank | Idea | Score | Est ARR | Status |
|------|------|-------|---------|--------|
| 1 | AdLens | 8.1 🔥 | $96K-$150K | **BUILD FIRST** |
| 2 | CloseBot | 7.4 🟢 | $72K-$120K | Queue |
| 3 | MCPEngine | 7.2 🟢 | $48K-$96K | Queue |
| 4 | Video Learning Tool | 6.8 🟡 | $36K-$72K | Queue |
| 5 | Prediction Dashboard | 6.5 🟡 | $24K-$60K | Queue |
| 6 | LSAT EdTech | 6.3 🟡 | $48K-$96K | Queue |
| 7 | AI Agent Consulting | 6.2 🟡 | $120K-$240K | Service (not SaaS) |
| 8 | AgentXchange | 5.8 🟡 | $12K-$36K | Queue |
| 9 | Signet | 8.2⭐ | Protocol | Special case — DAOA |
| 10 | Work Adventure Fork | 4.8 🔴 | $12K-$24K | Too complex |
| 11 | Polymarket Engine | 4.2 🔴 | N/A | Trading op, not SaaS |

---

## KPI Targets

| KPI | Now | 3mo | 6mo | 12mo |
|-----|-----|-----|-----|------|
| Active builders | 1 | 3 | 6 | 10+ |
| Ideas proposed/mo | ~1 | 5 | 10 | 20+ |
| Exits | 0 | 1 | 4 | 12 |
| Total members | 18 | 40 | 100 | 300 |

---

## What Needs to Happen Next

1. **Exit #1** — Start AdLens. Nicholai builds MVP. Mike owns product + domain expertise. Jake owns distribution. 4-6 weeks to demo.
2. **Recruit builders** — Every new builder is a force multiplier. Need 3 more Nicholais.
3. **Link GitHub accounts** — 15 of 18 members have no GitHub linked. Blocks PR tracking and team matching.
4. **Add OpenAI API key** — The auto-analyzer falls back to gpt-4o-mini when no classic Anthropic key is present. `signet secret put OPENAI_API_KEY`
5. **Idea submission habit** — Mike has 10 ideas tracked. Everyone else has 0-1. Need a weekly "idea drop" ritual.

---

*ExitStorm — Built on the OpenClaw Discord · Powered by Signet · March 2026*
