import { describe, it, expect } from 'vitest';
import { allocateProjectPoints } from '../src/allocator.js';
import type { ProjectAnalysis } from '@exitstorm/core';

function makeAnalysis(overrides: Partial<ProjectAnalysis> = {}): ProjectAnalysis {
  return {
    appType: 'B2B SaaS', device: 'Web-first', market: 'SMB',
    pricingModel: 'Subscription', timeToValue: 'Immediate (<5min)',
    pricePoints: { entry: 49, mid: 149, enterprise: 499 },
    mrr12mo: { optimistic: 15000, realistic: 8000, conservative: 3000 },
    arr12mo: { optimistic: 180000, realistic: 96000, conservative: 36000 },
    valuation12mo: { low: 288000, high: 1152000, multiple: '8-12x ARR' },
    monthsToBreakeven: 8, speedToExit: '18-24 months',
    gradingCriteria: {
      arrQuality: 8, churnAchievability: 7, founderDependenceInv: 9,
      ruleOf40Potential: 7, pricingPower: 8, marketTiming: 8,
      buildSpeed: 7, defensibility: 6, notes: {},
    },
    priorityScore: 7.4, priorityVerdict: 'solid',
    reasoning: 'Test', competitorNote: null,
    ...overrides,
  };
}

describe('allocateProjectPoints', () => {
  it('gives 5000 base points for $50K-$200K ARR (realistic: 96000)', () => {
    const analysis = makeAnalysis();
    const result = allocateProjectPoints('Test Project', analysis);
    expect(result.basePoints).toBe(5000);
  });

  it('applies 1.0x multiplier for priority score 6-7.9', () => {
    const analysis = makeAnalysis({ priorityScore: 7.4 });
    const result = allocateProjectPoints('Test Project', analysis);
    expect(result.multiplier).toBe(1.0);
    expect(result.totalPoints).toBe(5000);
  });

  it('applies 1.5x multiplier for priority score >= 8', () => {
    const analysis = makeAnalysis({ priorityScore: 8.5 });
    const result = allocateProjectPoints('Test Project', analysis);
    expect(result.multiplier).toBe(1.5);
    expect(result.totalPoints).toBe(7500);
  });

  it('applies 0.5x multiplier for priority score < 6', () => {
    const analysis = makeAnalysis({ priorityScore: 4.0 });
    const result = allocateProjectPoints('Test Project', analysis);
    expect(result.multiplier).toBe(0.5);
    expect(result.totalPoints).toBe(2500);
  });

  it('has 7 roles in breakdown summing to 100%', () => {
    const analysis = makeAnalysis();
    const result = allocateProjectPoints('Test Project', analysis);
    expect(result.breakdown).toHaveLength(7);
    const totalPct = result.breakdown.reduce((sum, r) => {
      return sum + parseInt(r.percentage.replace('%', ''), 10);
    }, 0);
    expect(totalPct).toBe(100);
  });

  it('has 8 milestones with last one at 100%', () => {
    const analysis = makeAnalysis();
    const result = allocateProjectPoints('Test Project', analysis);
    expect(result.milestonePoints).toHaveLength(8);
    const last = result.milestonePoints[result.milestonePoints.length - 1];
    expect(last.cumulativePct).toBe('100%');
  });

  it('gives 500 base points for ARR < $10K', () => {
    const analysis = makeAnalysis({
      arr12mo: { optimistic: 12000, realistic: 5000, conservative: 1000 },
    });
    const result = allocateProjectPoints('Small Project', analysis);
    expect(result.basePoints).toBe(500);
  });

  it('gives 50000 base points for ARR >= $1M', () => {
    const analysis = makeAnalysis({
      arr12mo: { optimistic: 2000000, realistic: 1200000, conservative: 800000 },
    });
    const result = allocateProjectPoints('Big Project', analysis);
    expect(result.basePoints).toBe(50000);
  });
});
