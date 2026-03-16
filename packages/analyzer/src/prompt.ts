/**
 * Prompt builder for financial analysis.
 */

export function buildAnalysisPrompt(
  title: string,
  description: string,
  existingProjects: Array<{ title: string; description: string }> = [],
): string {
  const existingContext = existingProjects.length > 0
    ? `\n\nExisting pipeline projects for priority comparison:\n${existingProjects
        .map(p => `- ${p.title}: ${(p.description || '').slice(0, 120)}`)
        .join('\n')}`
    : '';

  return `You are a startup financial analyst specializing in indie SaaS, micro-SaaS, and AI tools.
Analyze this proposed project and return a financial model as JSON.

Project Title: ${title}
Description: ${description}${existingContext}

Return ONLY valid JSON (no markdown, no explanation) with this EXACT structure:
{
  "appType": "B2B SaaS|B2C SaaS|Mobile|API tool|Marketplace|Other",
  "device": "Web-first|Mobile-first|Cross-platform",
  "market": "Consumer|SMB|Mid-market|Enterprise",
  "pricingModel": "Subscription|Freemium|Usage-based|One-time|Hybrid",
  "timeToValue": "Immediate (<5min)|Needs setup|Needs repeated use",
  "pricePoints": { "entry": 49, "mid": 149, "enterprise": 499 },
  "mrr12mo": { "optimistic": 15000, "realistic": 8000, "conservative": 3000 },
  "arr12mo": { "optimistic": 180000, "realistic": 96000, "conservative": 36000 },
  "valuation12mo": { "low": 288000, "high": 1152000, "multiple": "8-12x ARR (B2B AI)" },
  "monthsToBreakeven": 8,
  "speedToExit": "18-24 months",
  "gradingCriteria": {
    "arrQuality": 8,
    "churnAchievability": 7,
    "founderDependenceInv": 9,
    "ruleOf40Potential": 7,
    "pricingPower": 8,
    "marketTiming": 8,
    "buildSpeed": 7,
    "defensibility": 6,
    "notes": {
      "arrQuality": "one-line rationale",
      "churnAchievability": "one-line rationale",
      "founderDependenceInv": "one-line rationale",
      "ruleOf40Potential": "one-line rationale",
      "pricingPower": "one-line rationale",
      "marketTiming": "one-line rationale",
      "buildSpeed": "one-line rationale",
      "defensibility": "one-line rationale"
    }
  },
  "reasoning": "2-3 sentence financial model summary.",
  "competitorNote": null
}

=== GRADING CRITERIA DEFINITIONS ===
Score each 0-10 based on the project title and description:

1. arrQuality (weight 15%): How recurring and predictable is the revenue?
   10 = pure SaaS subscription, very sticky. 5 = mixed. 1 = one-time purchase only.

2. churnAchievability (weight 10%): How realistically can the product retain users 12+ months?
   10 = deeply embedded workflow tool. 5 = moderate switching cost. 1 = novelty/single-use.

3. founderDependenceInv (weight 10%): INVERTED — how productized is the delivery?
   10 = fully automated, no founder input needed. 5 = some ongoing config. 2 = fully founder-dependent.

4. ruleOf40Potential (weight 15%): Likelihood of hitting Rule of 40 within 12mo.
   10 = high-margin software with fast growth trajectory. 5 = moderate. 1 = capital-intensive.

5. pricingPower (weight 10%): Can the product command premium pricing?
   10 = solves a $10K+/yr pain point. 5 = moderate willingness-to-pay. 1 = commodity.

6. marketTiming (weight 10%): Is the market ready RIGHT NOW?
   10 = riding a strong current trend. 5 = stable market. 1 = ahead of market or fading.

7. buildSpeed (weight 15%): How fast can a small team ship a working v1?
   10 = <2 weeks. 7 = 4-8 weeks. 4 = 3-6 months. 1 = 1yr+.

8. defensibility (weight 15%): How hard is the product to copy?
   10 = proprietary data moat, network effects. 5 = some differentiation. 1 = thin wrapper.

=== FINANCIAL RULES ===
Valuation multiples:
- B2B AI SaaS (SMB/Mid-market): 8-12x ARR
- B2C SaaS / Consumer: 3-5x ARR
- Micro-SaaS (solo-buildable <3mo): 2.5-4.5x SDE (SDE = ARR × 0.6)
- API tool / usage-based: 5-8x ARR
- Marketplace: 3-6x ARR

competitorNote: If pipeline projects provided, compare in 1 sentence. Otherwise null.`;
}
