/**
 * Project routes — extracted for when the API grows.
 * Currently, routes are defined inline in index.ts.
 * This file serves as the pattern for route extraction.
 */

import { Hono } from 'hono';
import type { ContributionDB } from '@exitstorm/db';

export function createProjectRoutes(db: ContributionDB): Hono {
  const router = new Hono();

  router.get('/', (c) => {
    const status = c.req.query('status');
    const projects = db.listProjects(status);
    return c.json({ projects, count: projects.length });
  });

  router.get('/:id', (c) => {
    const id = Number(c.req.param('id'));
    const project = db.getProject(id);
    if (!project) return c.json({ error: 'Project not found' }, 404);

    let analysis = null;
    if (project.analysis_json) {
      try { analysis = JSON.parse(project.analysis_json); } catch { /* ignore */ }
    }
    return c.json({ project, analysis });
  });

  return router;
}
