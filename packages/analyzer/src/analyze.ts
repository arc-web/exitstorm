/**
 * Core analysis function — calls AI provider and parses the result.
 */

import type { ProjectAnalysis, GradingCriteria } from '@exitstorm/core';
import { computePriorityScore, priorityVerdict, clamp } from '@exitstorm/core';
import { buildAnalysisPrompt } from './prompt.js';

// ── AI Providers ───────────────────────────────────────────────────────────

async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20250315',
    max_tokens: 1800,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = response.content[0];
  return block?.type === 'text' ? block.text : '';
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1800,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are a startup financial analyst. Return only valid JSON, no markdown.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Result Parser ──────────────────────────────────────────────────────────

function parseResult(rawText: string): ProjectAnalysis {
  const clean = rawText
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Could not parse JSON from AI response: ${clean.slice(0, 300)}`);
    parsed = JSON.parse(match[0]);
  }

  // Clamp grading criteria and compute deterministic priority score
  const gc = (parsed.gradingCriteria ?? {}) as Record<string, unknown>;
  const criteria: Omit<GradingCriteria, 'notes'> = {
    arrQuality:           clamp(Number(gc.arrQuality) || 5, 0, 10),
    churnAchievability:   clamp(Number(gc.churnAchievability) || 5, 0, 10),
    founderDependenceInv: clamp(Number(gc.founderDependenceInv) || 5, 0, 10),
    ruleOf40Potential:    clamp(Number(gc.ruleOf40Potential) || 5, 0, 10),
    pricingPower:         clamp(Number(gc.pricingPower) || 5, 0, 10),
    marketTiming:         clamp(Number(gc.marketTiming) || 5, 0, 10),
    buildSpeed:           clamp(Number(gc.buildSpeed) || 5, 0, 10),
    defensibility:        clamp(Number(gc.defensibility) || 5, 0, 10),
  };

  const score = computePriorityScore(criteria);
  const verdict = priorityVerdict(score);

  return {
    ...(parsed as unknown as ProjectAnalysis),
    gradingCriteria: {
      ...criteria,
      notes: (gc.notes as Record<string, string>) ?? {},
    },
    priorityScore: score,
    priorityVerdict: verdict,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface AnalyzeOptions {
  /** Anthropic API key (classic sk-ant-api*) */
  anthropicKey?: string;
  /** OpenAI API key */
  openaiKey?: string;
}

/**
 * Analyze a proposed project and return a financial model with weighted priority score.
 */
export async function analyzeProject(
  title: string,
  description: string,
  existingProjects: Array<{ title: string; description: string }> = [],
  options: AnalyzeOptions = {},
): Promise<ProjectAnalysis> {
  const prompt = buildAnalysisPrompt(title, description, existingProjects);

  const anthropicKey = options.anthropicKey ?? process.env.ANTHROPIC_API_KEY;
  const openaiKey = options.openaiKey ?? process.env.OPENAI_API_KEY;

  // 1. Try Anthropic (classic API key only)
  if (anthropicKey?.startsWith('sk-ant-api')) {
    try {
      const text = await callAnthropic(anthropicKey, prompt);
      return parseResult(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[analyzer] Anthropic failed, falling back to OpenAI:', msg);
    }
  }

  // 2. Fall back to OpenAI
  if (openaiKey?.startsWith('sk-')) {
    const text = await callOpenAI(openaiKey, prompt);
    return parseResult(text);
  }

  throw new Error(
    'No working AI API key. Need ANTHROPIC_API_KEY (classic sk-ant-api*) or OPENAI_API_KEY.',
  );
}
