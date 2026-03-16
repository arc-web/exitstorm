/**
 * @exitstorm/db
 *
 * SQLite database layer for ExitStorm. Provides the ContributionDB class
 * with all CRUD operations, migration support, and typed query helpers.
 */

export { ContributionDB } from './contribution-db.js';
export { runMigrations } from './migrate.js';

// Re-export types consumers need
export type {
  Member,
  Contribution,
  ContributionInput,
  PointBreakdown,
  CommunityProject,
  ProjectTask,
  Season,
  SystemStats,
  VouchCheck,
  VoteResult,
  FinalizeResult,
  GitHubEvent,
} from '@exitstorm/core';
