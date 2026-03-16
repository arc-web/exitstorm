/**
 * Team Recommender — matches community members to project roles
 * based on their contribution history.
 */

import type { ProjectAnalysis, TeamRecommendation, PointBreakdown } from '@exitstorm/core';
import { ROLE_MAP, CONTRIBUTION_ROLE_AFFINITY } from '@exitstorm/core';
import { ContributionDB } from '@exitstorm/db';

function getRolesForAppType(appType: string): string[] {
  for (const [key, roles] of Object.entries(ROLE_MAP)) {
    if (appType?.toLowerCase().includes(key.toLowerCase())) {
      return roles;
    }
  }
  return ROLE_MAP['Other'];
}

function roleAffinityScore(breakdown: PointBreakdown[], role: string): number {
  let score = 0;
  for (const { type, count, total_points } of breakdown) {
    const affinityRoles = CONTRIBUTION_ROLE_AFFINITY[type] ?? [];
    if (affinityRoles.includes(role)) {
      score += total_points;
      score += count * 2;
    }
  }
  return score;
}

function generateReason(breakdown: PointBreakdown[], role: string): string {
  let bestType: string | null = null;
  let bestPts = 0;
  for (const { type, total_points } of breakdown) {
    const affinityRoles = CONTRIBUTION_ROLE_AFFINITY[type] ?? [];
    if (affinityRoles.includes(role) && total_points > bestPts) {
      bestType = type;
      bestPts = total_points;
    }
  }
  if (!bestType) return 'Active community contributor';
  const label = bestType.replace(/_/g, ' ');
  return `Top contributor via ${label} (${bestPts} pts)`;
}

/**
 * Recommend team members for a project based on DB contribution data.
 */
export async function recommendTeam(
  _title: string,
  analysis: ProjectAnalysis,
  dbPathOrInstance: string | ContributionDB,
): Promise<TeamRecommendation[]> {
  const neededRoles = getRolesForAppType(analysis.appType);

  let db: ContributionDB;
  let shouldClose = false;

  if (typeof dbPathOrInstance === 'string') {
    try {
      db = new ContributionDB(dbPathOrInstance);
      db.init();
      shouldClose = true;
    } catch (err: unknown) {
      console.warn('[team-recommender] Cannot open DB:', err);
      return fallbackTeam(neededRoles);
    }
  } else {
    db = dbPathOrInstance;
  }

  try {
    const members = db.getLeaderboard({ limit: 50 });
    if (!members.length) return fallbackTeam(neededRoles);

    const memberData = members.map((m) => ({
      ...m,
      breakdown: db.getPointBreakdown(m.discord_id),
    }));

    const assigned = new Set<string>();
    const recommendations: TeamRecommendation[] = [];

    for (const role of neededRoles) {
      const candidates = memberData
        .filter((m) => !assigned.has(m.discord_id))
        .map((m) => ({
          ...m,
          affinityScore: roleAffinityScore(m.breakdown, role),
        }))
        .sort((a, b) => {
          if (b.affinityScore !== a.affinityScore) return b.affinityScore - a.affinityScore;
          return b.total_points - a.total_points;
        });

      const best = candidates[0];

      if (best && best.affinityScore > 0) {
        assigned.add(best.discord_id);
        recommendations.push({
          userId: best.discord_id,
          discordName: best.display_name || best.username,
          role,
          reason: generateReason(best.breakdown, role),
          contributionScore: best.total_points,
        });
      } else if (best && best.total_points > 0) {
        assigned.add(best.discord_id);
        recommendations.push({
          userId: best.discord_id,
          discordName: best.display_name || best.username,
          role,
          reason: `Top contributor (${best.total_points} pts) — could take on ${role}`,
          contributionScore: best.total_points,
        });
      } else {
        recommendations.push({
          userId: null,
          discordName: null,
          role,
          reason: 'Open role — community recruitment needed',
          contributionScore: 0,
        });
      }
    }

    return recommendations;
  } finally {
    if (shouldClose) {
      try { db.close(); } catch { /* ignore */ }
    }
  }
}

function fallbackTeam(roles: string[]): TeamRecommendation[] {
  return roles.map((role) => ({
    userId: null,
    discordName: null,
    role,
    reason: 'TBD — open for applications',
    contributionScore: 0,
  }));
}
