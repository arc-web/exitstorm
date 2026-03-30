import { describe, it, expect } from 'vitest';
import {
  computePriorityScore,
  priorityVerdict,
  getLevelInfo,
  formatCurrency,
  clamp,
} from '../src/utils.js';

// ── computePriorityScore ───────────────────────────────────────────────────

describe('computePriorityScore', () => {
  it('returns a weighted average across 8 criteria', () => {
    const criteria = {
      arrQuality: 8,
      churnAchievability: 7,
      founderDependenceInv: 9,
      ruleOf40Potential: 7,
      pricingPower: 8,
      marketTiming: 8,
      buildSpeed: 7,
      defensibility: 6,
    };
    // manual: 8*0.15 + 7*0.10 + 9*0.10 + 7*0.15 + 8*0.10 + 8*0.10 + 7*0.15 + 6*0.15
    // = 1.2 + 0.7 + 0.9 + 1.05 + 0.8 + 0.8 + 1.05 + 0.9 = 7.4
    expect(computePriorityScore(criteria)).toBe(7.4);
  });

  it('returns 0 when all criteria are 0', () => {
    const criteria = {
      arrQuality: 0, churnAchievability: 0, founderDependenceInv: 0,
      ruleOf40Potential: 0, pricingPower: 0, marketTiming: 0,
      buildSpeed: 0, defensibility: 0,
    };
    expect(computePriorityScore(criteria)).toBe(0);
  });

  it('returns 10 when all criteria are 10', () => {
    const criteria = {
      arrQuality: 10, churnAchievability: 10, founderDependenceInv: 10,
      ruleOf40Potential: 10, pricingPower: 10, marketTiming: 10,
      buildSpeed: 10, defensibility: 10,
    };
    expect(computePriorityScore(criteria)).toBe(10);
  });

  it('correctly handles specific mixed values', () => {
    const criteria = {
      arrQuality: 5, churnAchievability: 5, founderDependenceInv: 5,
      ruleOf40Potential: 5, pricingPower: 5, marketTiming: 5,
      buildSpeed: 5, defensibility: 5,
    };
    // all 5 * 1.0 = 5
    expect(computePriorityScore(criteria)).toBe(5);
  });
});

// ── priorityVerdict ────────────────────────────────────────────────────────

describe('priorityVerdict', () => {
  it('returns "build first" for score >= 8', () => {
    expect(priorityVerdict(8)).toBe('build first');
    expect(priorityVerdict(9.5)).toBe('build first');
    expect(priorityVerdict(10)).toBe('build first');
  });

  it('returns "solid" for score 7-7.9', () => {
    expect(priorityVerdict(7)).toBe('solid');
    expect(priorityVerdict(7.4)).toBe('solid');
    expect(priorityVerdict(7.9)).toBe('solid');
  });

  it('returns "queue it" for score 5-6.9', () => {
    expect(priorityVerdict(5)).toBe('queue it');
    expect(priorityVerdict(6)).toBe('queue it');
    expect(priorityVerdict(6.9)).toBe('queue it');
  });

  it("returns \"don't build\" for score < 5", () => {
    expect(priorityVerdict(4.9)).toBe("don't build");
    expect(priorityVerdict(0)).toBe("don't build");
  });
});

// ── getLevelInfo ───────────────────────────────────────────────────────────

describe('getLevelInfo', () => {
  it('returns Newcomer (level 1) at 0 points', () => {
    const info = getLevelInfo(0);
    expect(info.name).toBe('Newcomer');
    expect(info.level).toBe(1);
  });

  it('returns Architect (level 7) at 5000 points', () => {
    const info = getLevelInfo(5000);
    expect(info.name).toBe('Architect');
    expect(info.level).toBe(7);
  });

  it('includes next level info when not at max', () => {
    const info = getLevelInfo(0);
    expect(info.next).not.toBeNull();
    expect(info.next?.name).toBe('Participant');
  });

  it('returns null for next level at max level', () => {
    const info = getLevelInfo(9999);
    expect(info.next).toBeNull();
  });
});

// ── formatCurrency ─────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats thousands as K', () => {
    expect(formatCurrency(96000)).toBe('$96K');
    expect(formatCurrency(1000)).toBe('$1K');
  });

  it('formats millions as M', () => {
    expect(formatCurrency(1_000_000)).toBe('$1.0M');
    expect(formatCurrency(2_500_000)).toBe('$2.5M');
  });

  it('leaves small amounts as-is', () => {
    expect(formatCurrency(500)).toBe('$500');
    expect(formatCurrency(0)).toBe('$0');
  });
});

// ── clamp ─────────────────────────────────────────────────────────────────

describe('clamp', () => {
  it('clamps value below min to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps value above max to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('leaves value in range unchanged', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
