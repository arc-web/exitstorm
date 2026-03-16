/**
 * @exitstorm/graphics
 *
 * Generates 3 supporting graphics for a project financial analysis:
 * 1. Pricing Model Chart — tier structure + MRR projections
 * 2. Path to Exit Timeline — launch → breakeven → ARR target → exit window
 * 3. Competitor Landscape — 2x2 positioning matrix
 *
 * Uses an external image generation script (configurable).
 * Never throws — returns partial results if some images fail.
 */

import { exec as execCb } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { ProjectAnalysis } from '@exitstorm/core';
import { slugify, fileTimestamp } from '@exitstorm/core';

export interface GraphicsResult {
  pricingChart: string | null;
  exitChart: string | null;
  competitorLandscape: string | null;
}

export interface GraphicsOptions {
  /** Path to the image generation script */
  generatorScript?: string;
  /** Output directory for generated images */
  outputDir?: string;
  /** Timeout in ms for each image generation (default: 120s) */
  timeout?: number;
}

// ── Image Generation ───────────────────────────────────────────────────────

function generateImage(
  prompt: string,
  outputPath: string,
  scriptPath: string,
  timeout: number,
): Promise<string | null> {
  return new Promise((resolve) => {
    const tmpPromptFile = join(tmpdir(), `prompt-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
    writeFileSync(tmpPromptFile, prompt, 'utf8');

    const cmd = `uv run ${scriptPath} --prompt "$(cat ${tmpPromptFile})" --filename "${outputPath}" --resolution 2K`;

    execCb(cmd, { timeout, maxBuffer: 5 * 1024 * 1024 }, (err) => {
      try { unlinkSync(tmpPromptFile); } catch { /* ignore */ }

      if (err) {
        console.error(`[graphics] Image generation failed for ${outputPath}:`, err.message);
        resolve(null);
        return;
      }

      resolve(existsSync(outputPath) ? outputPath : null);
    });
  });
}

// ── Prompt Builders ────────────────────────────────────────────────────────

function buildPricingPrompt(title: string, analysis: ProjectAnalysis): string {
  const pp = analysis.pricePoints ?? { entry: 49, mid: 149, enterprise: 499 };
  const mrr = analysis.mrr12mo ?? { conservative: 3000, realistic: 8000, optimistic: 15000 };
  return `Create a sleek dark-theme SaaS pricing visualization infographic for "${title}".

Layout: Dark navy/charcoal background (#0D1117), clean tech aesthetic.

Show a ${analysis.pricingModel || 'Subscription'} pricing model with 3 tiers:
- Starter: $${pp.entry}/mo
- Growth: $${pp.mid}/mo (featured with cyan accent glow)
- Enterprise: $${pp.enterprise}/mo

Below, show "12-Month MRR Projections":
- Conservative: $${mrr.conservative.toLocaleString()}/mo (coral bar)
- Realistic: $${mrr.realistic.toLocaleString()}/mo (amber bar)
- Optimistic: $${mrr.optimistic.toLocaleString()}/mo (teal bar)

Title: "${title} — Pricing Model". Style: Minimal, modern, dark mode, monospace numbers.`;
}

function buildExitPrompt(title: string, analysis: ProjectAnalysis): string {
  const val = analysis.valuation12mo ?? { low: 288000, high: 1152000 };
  const arr = analysis.arr12mo?.realistic ?? 96000;
  const score = analysis.priorityScore ?? 7.0;
  return `Create a dark-theme startup exit timeline roadmap for "${title}".

Horizontal timeline milestones:
1. "Launch" — Month 0
2. "Breakeven" — Month ${analysis.monthsToBreakeven ?? 8}
3. "$${Math.round(arr / 1000)}K ARR" — Month 12
4. "Exit Window" — ${analysis.speedToExit ?? '18-24 months'}

Show valuation: "$${Math.round(val.low / 1000)}K – $${Math.round(val.high / 1000)}K"
Priority badge: "${score}/10" with ${score >= 8 ? 'green' : score >= 7 ? 'blue' : 'amber'} glow.
Title: "${title} — Path to Exit". Style: Dark mode, gradient accents.`;
}

function buildCompetitorPrompt(title: string, analysis: ProjectAnalysis): string {
  return `Create a dark-theme 2x2 competitive positioning matrix for "${title}".

Axes: X = "Ease of Use" (Low→High), Y = "Price" (Low→High)
Quadrants: Enterprise Platforms (top-left), Premium SaaS (top-right), Legacy Tools (bottom-left), Free/Indie (bottom-right)
"${title}" as bright teal dot standing out from gray competitor blobs.

Subtitle: "${analysis.market || 'SMB'} · ${analysis.pricingModel || 'Subscription'} · $${analysis.pricePoints?.entry || 49}/mo"
Title: "${title} — Market Position". Style: Dark mode, clean quadrant chart.`;
}

// ── Public API ─────────────────────────────────────────────────────────────

const DEFAULT_SCRIPT = '/opt/homebrew/lib/node_modules/clawdbot/skills/nano-banana-pro/scripts/generate_image.py';

/**
 * Generate 3 supporting graphics for a project financial analysis.
 */
export async function generateProjectGraphics(
  title: string,
  analysis: ProjectAnalysis,
  options: GraphicsOptions = {},
): Promise<GraphicsResult> {
  const outputDir = options.outputDir ?? process.cwd();
  const scriptPath = options.generatorScript ?? DEFAULT_SCRIPT;
  const timeout = options.timeout ?? 120_000;

  const ts = fileTimestamp();
  const slug = slugify(title);

  const [pricingChart, exitChart, competitorLandscape] = await Promise.all([
    generateImage(buildPricingPrompt(title, analysis), join(outputDir, `${ts}-${slug}-pricing.png`), scriptPath, timeout),
    generateImage(buildExitPrompt(title, analysis), join(outputDir, `${ts}-${slug}-exit.png`), scriptPath, timeout),
    generateImage(buildCompetitorPrompt(title, analysis), join(outputDir, `${ts}-${slug}-competitor.png`), scriptPath, timeout),
  ]);

  const count = [pricingChart, exitChart, competitorLandscape].filter(Boolean).length;
  console.log(`[graphics] ${count}/3 images generated for "${title}"`);

  return { pricingChart, exitChart, competitorLandscape };
}
