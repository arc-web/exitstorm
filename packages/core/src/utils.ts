/**
 * Shared utility functions for ExitStorm.
 */

import { LEVELS, PRIORITY_WEIGHTS } from './constants.js';
import type { LevelDef, GradingCriteria } from './index.js';

// ── Level Utilities ────────────────────────────────────────────────────────

export interface LevelInfo {
  current: LevelDef;
  next: LevelDef | null;
  level: number;
  name: string;
}

/**
 * Get the level info for a given point total.
 */
export function getLevelInfo(totalPoints: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].min) {
      return {
        current: LEVELS[i],
        next: LEVELS[i + 1] ?? null,
        level: LEVELS[i].level,
        name: LEVELS[i].name,
      };
    }
  }
  return {
    current: LEVELS[0],
    next: LEVELS[1] ?? null,
    level: LEVELS[0].level,
    name: LEVELS[0].name,
  };
}

/**
 * Build an ASCII progress bar showing progress to the next level.
 */
export function buildProgressBar(totalPoints: number, blocks = 10): string {
  const { current, next } = getLevelInfo(totalPoints);
  if (!next) return '🟩'.repeat(blocks) + ' **MAX LEVEL**';
  const progress = totalPoints - current.min;
  const needed = next.min - current.min;
  const filled = Math.min(blocks, Math.floor((progress / needed) * blocks));
  return '🟩'.repeat(filled) + '⬜'.repeat(blocks - filled) + ` ${progress}/${needed}`;
}

// ── Priority Score ─────────────────────────────────────────────────────────

/**
 * Compute the weighted priority score from the 8 grading criteria.
 * All inputs are 0-10. Returns 0-10, rounded to 1 decimal.
 */
export function computePriorityScore(criteria: Omit<GradingCriteria, 'notes'>): number {
  const score =
    (criteria.arrQuality           * PRIORITY_WEIGHTS.arrQuality) +
    (criteria.churnAchievability   * PRIORITY_WEIGHTS.churnAchievability) +
    (criteria.founderDependenceInv * PRIORITY_WEIGHTS.founderDependenceInv) +
    (criteria.ruleOf40Potential    * PRIORITY_WEIGHTS.ruleOf40Potential) +
    (criteria.pricingPower         * PRIORITY_WEIGHTS.pricingPower) +
    (criteria.marketTiming         * PRIORITY_WEIGHTS.marketTiming) +
    (criteria.buildSpeed           * PRIORITY_WEIGHTS.buildSpeed) +
    (criteria.defensibility        * PRIORITY_WEIGHTS.defensibility);
  return Math.round(score * 10) / 10;
}

/**
 * Human-readable verdict from the weighted score.
 */
export function priorityVerdict(score: number): string {
  if (score >= 8) return 'build first';
  if (score >= 7) return 'solid';
  if (score >= 5) return 'queue it';
  return "don't build";
}

// ── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format a number as currency (e.g., 96000 → "$96K").
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

/**
 * Slugify a string for use in filenames/URLs.
 */
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);
}

/**
 * Generate an ISO timestamp suitable for filenames.
 */
export function fileTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ── Validation ─────────────────────────────────────────────────────────────

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
