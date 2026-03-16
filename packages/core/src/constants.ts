/**
 * Shared constants for ExitStorm.
 */

// ── Level Definitions ──────────────────────────────────────────────────────

export interface LevelDef {
  level: number;
  name: string;
  min: number;
  emoji: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1, name: 'Newcomer',    min: 0,    emoji: '(._. )' },
  { level: 2, name: 'Participant', min: 50,   emoji: '( ._.)' },
  { level: 3, name: 'Contributor', min: 200,  emoji: '(o_o )' },
  { level: 4, name: 'Regular',     min: 500,  emoji: '( ^_^)' },
  { level: 5, name: 'Champion',    min: 1000, emoji: '(*_* )' },
  { level: 6, name: 'Legend',      min: 2500, emoji: '(!!!)' },
  { level: 7, name: 'Architect',   min: 5000, emoji: '(GOD)' },
];

// ── Priority Score Weights ─────────────────────────────────────────────────

export const PRIORITY_WEIGHTS = {
  arrQuality:           0.15,
  churnAchievability:   0.10,
  founderDependenceInv: 0.10,
  ruleOf40Potential:    0.15,
  pricingPower:         0.10,
  marketTiming:         0.10,
  buildSpeed:           0.15,
  defensibility:        0.15,
} as const;

// ── Role Breakdown (% of total project points) ────────────────────────────

export const ROLE_BREAKDOWN = [
  { role: 'Lead Builder',      pct: 0.35 },
  { role: 'Co-Builder',        pct: 0.20 },
  { role: 'Designer/UX',       pct: 0.15 },
  { role: 'QA/Testing',        pct: 0.10 },
  { role: 'Growth/Marketing',  pct: 0.10 },
  { role: 'Community Manager', pct: 0.05 },
  { role: 'Docs/PM',           pct: 0.05 },
] as const;

// ── Contribution Role Affinity ─────────────────────────────────────────────
// Maps contribution types to which project roles they're evidence for.

export const CONTRIBUTION_ROLE_AFFINITY: Record<string, string[]> = {
  pr_merged:             ['Backend Engineer', 'Frontend Dev', 'Full Stack', 'Mobile Dev', 'DevOps'],
  pr_review:             ['Backend Engineer', 'Full Stack', 'QA/Testing', 'DevOps'],
  bug_report_github:     ['QA/Testing', 'Backend Engineer', 'Full Stack'],
  helpful_conversation:  ['Product', 'Community Manager', 'Growth/GTM', 'Technical Writer'],
  teaching_moment:       ['Technical Writer', 'Product', 'Community Manager'],
  tool_share:            ['DevOps', 'Backend Engineer', 'Full Stack', 'Frontend Dev'],
  idea_impact:           ['Product', 'Growth/GTM', 'UX Designer'],
  reaction_bonus:        ['Community Manager', 'Growth/GTM'],
  reaction_points:       ['Community Manager', 'Growth/GTM'],
  peer_vouch:            ['Community Manager', 'Product'],
  streak_bonus:          ['Full Stack', 'Backend Engineer'],
};

// ── Role Map by App Type ───────────────────────────────────────────────────

export const ROLE_MAP: Record<string, string[]> = {
  'B2B SaaS':    ['Backend Engineer', 'Frontend Dev', 'Growth/GTM', 'Product'],
  'B2C SaaS':    ['Full Stack', 'UX Designer', 'Growth/GTM', 'Community Manager'],
  'Mobile':      ['Mobile Dev', 'UX Designer', 'Backend Engineer', 'QA/Testing'],
  'API tool':    ['Backend Engineer', 'DevOps', 'Technical Writer', 'QA/Testing'],
  'Marketplace': ['Full Stack', 'Growth/GTM', 'Community Manager', 'UX Designer'],
  'Other':       ['Full Stack', 'Frontend Dev', 'Growth/GTM', 'Product'],
};

// ── Scoring Configs ────────────────────────────────────────────────────────

export const VOUCH_LIMITS = {
  dailyCap: 3,
  weeklyPerRecipient: 1,
  defaultPoints: 5,
} as const;

export const DAILY_POINT_CAPS: Record<string, number> = {
  '1-2': 50,
  '3-4': 75,
  '5-6': 100,
  '7': 150,
};

export const STREAK_MILESTONES = [
  { days: 30, pts: 30 },
  { days: 14, pts: 15 },
  { days: 7,  pts: 7 },
  { days: 3,  pts: 3 },
] as const;

// ── ARR → Base Points ─────────────────────────────────────────────────────

export const ARR_POINT_TIERS = [
  { minARR: 1_000_000, basePoints: 50_000 },
  { minARR: 200_000,   basePoints: 15_000 },
  { minARR: 50_000,    basePoints: 5_000 },
  { minARR: 10_000,    basePoints: 1_500 },
  { minARR: 0,         basePoints: 500 },
] as const;
