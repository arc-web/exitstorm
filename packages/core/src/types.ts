/**
 * Core type definitions for ExitStorm.
 * Every package imports types from here — single source of truth.
 */

// ── Member ─────────────────────────────────────────────────────────────────

export interface Member {
  discord_id: string;
  username: string;
  display_name: string | null;
  github_username: string | null;
  total_points: number;
  season_points: number;
  level: number;
  level_name: string;
  is_bot: boolean;
  first_seen_at: string;
  updated_at: string;
  first_points_notified: boolean;
}

export interface MemberStreak {
  member_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

// ── Contributions ──────────────────────────────────────────────────────────

export type ContributionType =
  | 'helpful_conversation'
  | 'teaching_moment'
  | 'tool_share'
  | 'pr_merged'
  | 'pr_review'
  | 'bug_report_github'
  | 'peer_vouch'
  | 'idea_impact'
  | 'reaction_bonus'
  | 'reaction_points'
  | 'streak_bonus'
  | 'challenge_completed'
  | 'project_proposed'
  | 'project_approved'
  | 'event_hosted';

export type ContributionSource =
  | 'ai_analysis'
  | 'github_webhook'
  | 'peer_vote'
  | 'manual'
  | 'event'
  | 'streak'
  | 'self_claim';

export interface Contribution {
  id: number;
  member_id: string;
  type: ContributionType;
  points: number;
  raw_score: number | null;
  multiplier: number;
  evidence: string | null;
  channel_id: string | null;
  channel_name: string | null;
  source: ContributionSource;
  season_id: number | null;
  message_ids: string | null;
  created_at: string;
}

export interface ContributionInput {
  memberId: string;
  type: ContributionType;
  points: number;
  rawScore?: number;
  multiplier?: number;
  evidence?: Record<string, unknown>;
  channelId?: string;
  channelName?: string;
  source: ContributionSource;
  messageIds?: string[];
  seasonId?: number;
  createdAt?: string;
}

export interface PointBreakdown {
  type: string;
  count: number;
  total_points: number;
}

// ── Projects ───────────────────────────────────────────────────────────────

export type ProjectStatus = 'voting' | 'active' | 'completed' | 'archived' | 'rejected' | 'cooldown';

export interface CommunityProject {
  id: number;
  title: string;
  description: string | null;
  repo_url: string | null;
  proposed_by: string;
  status: ProjectStatus;
  poll_message_id: string | null;
  poll_channel_id: string | null;
  poll_ends_at: string | null;
  votes_yes: number;
  votes_no: number;
  total_eligible_voters: number;
  attempt_number: number;
  last_failed_at: string | null;
  approved_at: string | null;
  analysis_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: 'open' | 'claimed' | 'completed' | 'cancelled';
  claimed_by: string | null;
  created_by: string;
  points: number;
  created_at: string;
  updated_at: string;
}

// ── Financial Analysis ─────────────────────────────────────────────────────

export type AppType = 'B2B SaaS' | 'B2C SaaS' | 'Mobile' | 'API tool' | 'Marketplace' | 'Other';
export type Market = 'Consumer' | 'SMB' | 'Mid-market' | 'Enterprise';
export type PricingModel = 'Subscription' | 'Freemium' | 'Usage-based' | 'One-time' | 'Hybrid';

export interface PricePoints {
  entry: number;
  mid: number;
  enterprise: number;
}

export interface RevenueRange {
  optimistic: number;
  realistic: number;
  conservative: number;
}

export interface ValuationRange {
  low: number;
  high: number;
  multiple: string;
}

export interface GradingCriteria {
  arrQuality: number;
  churnAchievability: number;
  founderDependenceInv: number;
  ruleOf40Potential: number;
  pricingPower: number;
  marketTiming: number;
  buildSpeed: number;
  defensibility: number;
  notes: Record<string, string>;
}

export interface ProjectAnalysis {
  appType: AppType;
  device: string;
  market: Market;
  pricingModel: PricingModel;
  timeToValue: string;
  pricePoints: PricePoints;
  mrr12mo: RevenueRange;
  arr12mo: RevenueRange;
  valuation12mo: ValuationRange;
  monthsToBreakeven: number;
  speedToExit: string;
  gradingCriteria: GradingCriteria;
  priorityScore: number;
  priorityVerdict: string;
  reasoning: string;
  competitorNote: string | null;
}

// ── Team Recommendations ───────────────────────────────────────────────────

export interface TeamRecommendation {
  userId: string | null;
  discordName: string | null;
  role: string;
  reason: string;
  contributionScore: number;
}

// ── Points Allocation ──────────────────────────────────────────────────────

export interface RoleAllocation {
  role: string;
  percentage: string;
  points: number;
}

export interface MilestoneAllocation {
  milestone: string;
  cumulativePct: string;
  cumulativePoints: number;
  incrementalPoints: number;
}

export interface PointsAllocation {
  project: string;
  totalPoints: number;
  basePoints: number;
  multiplier: number;
  realisticARR: number;
  priorityScore: number;
  breakdown: RoleAllocation[];
  milestonePoints: MilestoneAllocation[];
}

// ── Voting ─────────────────────────────────────────────────────────────────

export interface VoteResult {
  success: boolean;
  alreadyVoted: boolean;
}

export interface FinalizeResult {
  status: 'active' | 'rejected' | 'cooldown';
  passed: boolean;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  totalEligible: number;
  yesPct: number;
  participationPct: number;
}

// ── Seasons ────────────────────────────────────────────────────────────────

export interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
}

// ── Analyzer Plugin Interface ──────────────────────────────────────────────

export interface AnalyzerPlugin {
  /** Unique name for this analyzer */
  name: string;
  /** Semver version */
  version: string;
  /** Run analysis on a project proposal */
  analyze: (
    title: string,
    description: string,
    existingProjects?: Array<{ title: string; description: string }>,
  ) => Promise<Partial<ProjectAnalysis>>;
}

// ── Stats ──────────────────────────────────────────────────────────────────

export interface SystemStats {
  members: number;
  contributions: number;
  totalPoints: number;
  vouches: number;
  analysisRuns: number;
  activeSeason: Season | null;
}

// ── GitHub ─────────────────────────────────────────────────────────────────

export interface GitHubEvent {
  id: number;
  event_id: string;
  event_type: string;
  repo: string;
  github_author: string;
  discord_id: string | null;
  points_awarded: number;
  dry_run: boolean;
  created_at: string;
}

// ── Vouching ───────────────────────────────────────────────────────────────

export interface VouchCheck {
  allowed: boolean;
  reason?: string;
}
