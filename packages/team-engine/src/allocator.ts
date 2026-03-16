/**
 * Points Allocator — calculates contribution points for a project
 * based on its financial analysis, broken down by role and milestone.
 */

import type { ProjectAnalysis, PointsAllocation, RoleAllocation, MilestoneAllocation } from '@exitstorm/core';
import { ROLE_BREAKDOWN, ARR_POINT_TIERS } from '@exitstorm/core';

function getBasePoints(realisticARR: number): number {
  for (const tier of ARR_POINT_TIERS) {
    if (realisticARR >= tier.minARR) return tier.basePoints;
  }
  return 500;
}

function getPriorityMultiplier(priorityScore: number): number {
  if (priorityScore >= 8) return 1.5;
  if (priorityScore >= 6) return 1.0;
  return 0.5;
}

function buildMilestones(analysis: ProjectAnalysis): Array<{ milestone: string; cumulativePct: number }> {
  const realisticARR = analysis.arr12mo?.realistic ?? 0;
  const breakeven = analysis.monthsToBreakeven ?? 'TBD';

  return [
    { milestone: 'Project kickoff / repo created',      cumulativePct: 0.05 },
    { milestone: 'MVP shipped (working demo)',           cumulativePct: 0.20 },
    { milestone: 'First user / first paying customer',   cumulativePct: 0.35 },
    { milestone: '$1K MRR',                              cumulativePct: 0.50 },
    { milestone: '$5K MRR',                              cumulativePct: 0.65 },
    { milestone: `Breakeven (~${breakeven} mo)`,         cumulativePct: 0.80 },
    { milestone: `$${Math.round(realisticARR / 1000)}K ARR hit`, cumulativePct: 0.95 },
    { milestone: 'Exit / acquisition',                   cumulativePct: 1.00 },
  ];
}

/**
 * Calculate contribution points for a project and break them down
 * by role and milestone.
 */
export function allocateProjectPoints(
  title: string,
  analysis: ProjectAnalysis,
): PointsAllocation {
  const realisticARR = analysis.arr12mo?.realistic ?? 0;
  const priorityScore = analysis.priorityScore ?? 5;

  const basePoints = getBasePoints(realisticARR);
  const multiplier = getPriorityMultiplier(priorityScore);
  const totalPoints = Math.round(basePoints * multiplier);

  const breakdown: RoleAllocation[] = ROLE_BREAKDOWN.map(({ role, pct }) => ({
    role,
    percentage: `${Math.round(pct * 100)}%`,
    points: Math.round(totalPoints * pct),
  }));

  const milestones = buildMilestones(analysis);
  const milestonePoints: MilestoneAllocation[] = milestones.map((m, i) => {
    const prevPct = i > 0 ? milestones[i - 1].cumulativePct : 0;
    const incrementalPct = m.cumulativePct - prevPct;
    return {
      milestone: m.milestone,
      cumulativePct: `${Math.round(m.cumulativePct * 100)}%`,
      cumulativePoints: Math.round(totalPoints * m.cumulativePct),
      incrementalPoints: Math.round(totalPoints * incrementalPct),
    };
  });

  return {
    project: title,
    totalPoints,
    basePoints,
    multiplier,
    realisticARR,
    priorityScore,
    breakdown,
    milestonePoints,
  };
}
