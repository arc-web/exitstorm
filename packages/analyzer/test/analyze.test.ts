import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt } from '../src/prompt.js';

describe('buildAnalysisPrompt', () => {
  it('includes title and description', () => {
    const prompt = buildAnalysisPrompt('My App', 'A great app for teams');
    expect(prompt).toContain('My App');
    expect(prompt).toContain('A great app for teams');
  });

  it('includes existing projects when provided', () => {
    const existing = [
      { title: 'Project Alpha', description: 'First project' },
      { title: 'Project Beta', description: 'Second project' },
    ];
    const prompt = buildAnalysisPrompt('New App', 'New description', existing);
    expect(prompt).toContain('Project Alpha');
    expect(prompt).toContain('Project Beta');
    expect(prompt).toContain('pipeline projects');
  });

  it('omits existing projects section when empty', () => {
    const prompt = buildAnalysisPrompt('My App', 'Description', []);
    expect(prompt).not.toContain('Existing pipeline projects');
  });

  it('includes all 8 grading criteria', () => {
    const prompt = buildAnalysisPrompt('My App', 'Description');
    expect(prompt).toContain('arrQuality');
    expect(prompt).toContain('churnAchievability');
    expect(prompt).toContain('founderDependenceInv');
    expect(prompt).toContain('ruleOf40Potential');
    expect(prompt).toContain('pricingPower');
    expect(prompt).toContain('marketTiming');
    expect(prompt).toContain('buildSpeed');
    expect(prompt).toContain('defensibility');
  });

  it('includes valuation multiples', () => {
    const prompt = buildAnalysisPrompt('My App', 'Description');
    expect(prompt).toContain('8-12x ARR');
    expect(prompt).toContain('3-5x ARR');
    expect(prompt).toContain('Valuation multiples');
  });
});
