/**
 * @exitstorm/team-engine
 *
 * Two responsibilities:
 * 1. Team Recommendation — match community members to project roles
 * 2. Points Allocation — calculate contribution points per project
 */

export { recommendTeam } from './recommender.js';
export { allocateProjectPoints } from './allocator.js';
export type {
  TeamRecommendation,
  PointsAllocation,
  RoleAllocation,
  MilestoneAllocation,
} from '@exitstorm/core';
