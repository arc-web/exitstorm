/**
 * ExitStorm REST API
 *
 * Endpoints:
 *   GET  /health              — Health check
 *   GET  /api/v1/leaderboard  — Top contributors
 *   GET  /api/v1/projects     — Active/voting projects
 *   GET  /api/v1/projects/:id — Project details with analysis
 *   GET  /api/v1/stats        — System-wide stats
 *   POST /api/v1/analyze      — Run financial analysis on a project
 *   POST /api/v1/webhooks/github — GitHub webhook receiver
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { ContributionDB } from '@exitstorm/db';
import { analyzeProject } from '@exitstorm/analyzer';
import { allocateProjectPoints } from '@exitstorm/team-engine';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Database
const DB_PATH = process.env.DB_PATH ?? '../../data/contributions.db';
const db = new ContributionDB(DB_PATH).init();

// ── Routes ─────────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', service: 'exitstorm-api', version: '0.1.0' }));

app.get('/api/v1/leaderboard', (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 15), 100);
  const season = c.req.query('season') === 'true';
  const members = db.getLeaderboard({ limit, season });
  return c.json({ members, count: members.length });
});

app.get('/api/v1/projects', (c) => {
  const status = c.req.query('status');
  const projects = db.listProjects(status);
  return c.json({ projects, count: projects.length });
});

app.get('/api/v1/projects/:id', (c) => {
  const id = Number(c.req.param('id'));
  const project = db.getProject(id);
  if (!project) return c.json({ error: 'Project not found' }, 404);

  let analysis = null;
  if (project.analysis_json) {
    try { analysis = JSON.parse(project.analysis_json); } catch { /* ignore */ }
  }

  return c.json({ project, analysis });
});

app.get('/api/v1/stats', (c) => {
  const stats = db.getStats();
  return c.json(stats);
});

app.post('/api/v1/analyze', async (c) => {
  const body = await c.req.json<{ title: string; description: string }>();
  if (!body.title || !body.description) {
    return c.json({ error: 'title and description are required' }, 400);
  }

  try {
    const analysis = await analyzeProject(body.title, body.description);
    const points = allocateProjectPoints(body.title, analysis);
    return c.json({ analysis, points });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return c.json({ error: message }, 500);
  }
});

app.post('/api/v1/webhooks/github', async (c) => {
  // GitHub webhook receiver stub
  const event = c.req.header('X-GitHub-Event');
  const body = await c.req.json();
  console.log(`[webhook] GitHub event: ${event}`, body?.action);
  return c.json({ received: true, event });
});

// ── Start Server ───────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`\n⚡ ExitStorm API running on http://localhost:${info.port}`);
  console.log(`   Health: http://localhost:${info.port}/health\n`);
});

export default app;
