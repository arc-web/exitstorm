/**
 * @exitstorm/analyzer
 *
 * AI-powered financial analysis engine for project proposals.
 * Uses Anthropic Claude or OpenAI gpt-4o-mini to generate financial models,
 * then computes a deterministic weighted priority score.
 *
 * Supports the AnalyzerPlugin interface for extensibility.
 */

export { analyzeProject } from './analyze.js';
export { buildAnalysisPrompt } from './prompt.js';
export { computePriorityScore, priorityVerdict } from '@exitstorm/core';
export type { ProjectAnalysis, AnalyzerPlugin, GradingCriteria } from '@exitstorm/core';
