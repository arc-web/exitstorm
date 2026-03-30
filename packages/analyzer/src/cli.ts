#!/usr/bin/env tsx
/**
 * CLI entry point for ExitStorm analyzer.
 *
 * Usage:
 *   npx tsx packages/analyzer/src/cli.ts "Project Title" "Project description"
 *
 * Requires ANTHROPIC_API_KEY or OPENAI_API_KEY in environment.
 * Outputs full ProjectAnalysis as JSON to stdout.
 */

import { analyzeProject } from './analyze.js';
import { allocateProjectPoints } from '@exitstorm/team-engine';

const [title, description] = process.argv.slice(2);

if (!title || !description) {
  console.error('Usage: npx tsx packages/analyzer/src/cli.ts "Title" "Description"');
  process.exit(1);
}

async function main() {
  const analysis = await analyzeProject(title, description);
  const allocation = allocateProjectPoints(title, analysis);

  const result = {
    analysis,
    allocation,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
