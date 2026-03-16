-- ExitStorm Initial Schema
-- Migrated from contribution-system/src/db.js

-- ═══════════════════════════════════════════════════════════════════════
-- MEMBERS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS members (
  discord_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT,
  github_username TEXT,
  entire_username TEXT,
  total_points INTEGER DEFAULT 0,
  season_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Newcomer',
  is_bot INTEGER DEFAULT 0,
  first_points_notified INTEGER DEFAULT 0,
  first_seen_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════════════
-- SEASONS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════════════
-- CONTRIBUTIONS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT NOT NULL REFERENCES members(discord_id),
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  raw_score REAL,
  multiplier REAL DEFAULT 1.0,
  evidence TEXT,             -- JSON: message links, PR URLs, AI reasoning
  channel_id TEXT,
  channel_name TEXT,
  source TEXT NOT NULL,      -- 'ai_analysis', 'github_webhook', 'peer_vote', 'manual', 'event', 'streak'
  season_id INTEGER REFERENCES seasons(id),
  message_ids TEXT,          -- JSON array of message IDs
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contributions_member ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_type ON contributions(type);
CREATE INDEX IF NOT EXISTS idx_contributions_season ON contributions(season_id);
CREATE INDEX IF NOT EXISTS idx_contributions_created ON contributions(created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- VOUCHES
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vouches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voter_id TEXT NOT NULL REFERENCES members(discord_id),
  recipient_id TEXT NOT NULL REFERENCES members(discord_id),
  reason TEXT,
  points INTEGER DEFAULT 5,
  season_id INTEGER REFERENCES seasons(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vouches_voter ON vouches(voter_id);
CREATE INDEX IF NOT EXISTS idx_vouches_recipient ON vouches(recipient_id);
CREATE INDEX IF NOT EXISTS idx_vouches_created ON vouches(created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- COMMUNITY PROJECTS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  proposed_by TEXT NOT NULL,
  status TEXT DEFAULT 'voting',  -- voting, active, completed, archived, rejected, cooldown
  poll_message_id TEXT,
  poll_channel_id TEXT,
  poll_ends_at TEXT,
  votes_yes INTEGER DEFAULT 0,
  votes_no INTEGER DEFAULT 0,
  total_eligible_voters INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,
  last_failed_at TEXT,
  approved_at TEXT,
  analysis_json TEXT,            -- JSON blob from @exitstorm/analyzer
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_community_projects_status ON community_projects(status);

-- ═══════════════════════════════════════════════════════════════════════
-- PROJECT VOTES
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS project_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES community_projects(id),
  voter_id TEXT NOT NULL,
  vote TEXT NOT NULL,            -- 'yes' or 'no'
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(project_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_project_votes_project ON project_votes(project_id);

-- ═══════════════════════════════════════════════════════════════════════
-- PROJECT TASKS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES community_projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',    -- open, claimed, completed, cancelled
  claimed_by TEXT,
  created_by TEXT NOT NULL,
  points INTEGER DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id, status);

-- ═══════════════════════════════════════════════════════════════════════
-- LEGACY PROJECTS TABLE (for backward compat)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  proposed_by TEXT REFERENCES members(discord_id),
  approved_by TEXT,
  status TEXT DEFAULT 'proposed',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════════════
-- ANALYSIS RUNS (cost tracking + dedup)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS analysis_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT,
  channel_name TEXT,
  time_range_start TEXT NOT NULL,
  time_range_end TEXT NOT NULL,
  model_used TEXT,
  messages_analyzed INTEGER DEFAULT 0,
  conversations_scored INTEGER DEFAULT 0,
  contributions_created INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_estimate REAL DEFAULT 0,
  completed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_time ON analysis_runs(time_range_start, time_range_end);

-- ═══════════════════════════════════════════════════════════════════════
-- GITHUB EVENTS (dedup)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS github_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,  -- e.g. "pr_merged:openclaw/openclaw:42"
  event_type TEXT NOT NULL,
  repo TEXT NOT NULL,
  github_author TEXT NOT NULL,
  discord_id TEXT,
  points_awarded INTEGER DEFAULT 0,
  dry_run INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_github_events_id ON github_events(event_id);
CREATE INDEX IF NOT EXISTS idx_github_events_type ON github_events(event_type, repo);

-- ═══════════════════════════════════════════════════════════════════════
-- MEMBER STREAKS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS member_streaks (
  member_id TEXT PRIMARY KEY REFERENCES members(discord_id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════════════
-- LEVEL-UP LOG
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS level_up_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT NOT NULL,
  old_level INTEGER,
  new_level INTEGER,
  old_name TEXT,
  new_name TEXT,
  total_points INTEGER,
  announced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_level_up_log_member ON level_up_log(member_id, created_at);
CREATE INDEX IF NOT EXISTS idx_level_up_log_announced ON level_up_log(announced);

-- ═══════════════════════════════════════════════════════════════════════
-- LEVEL ANNOUNCEMENTS (prevent duplicates)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS level_announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  announced_at TEXT DEFAULT (datetime('now')),
  UNIQUE(member_id, level)
);

-- ═══════════════════════════════════════════════════════════════════════
-- VOICE SESSIONS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS voice_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  initiator_id TEXT REFERENCES members(discord_id),
  participant_ids TEXT,           -- JSON array
  started_at TEXT DEFAULT (datetime('now')),
  ended_at TEXT,
  peak_participants INTEGER DEFAULT 0,
  host_awarded INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_channel ON voice_sessions(channel_id, started_at);

-- ═══════════════════════════════════════════════════════════════════════
-- CHALLENGES / BOUNTIES
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  created_by TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'open',     -- open, claimed, completed, cancelled
  proof_required TEXT,
  deadline TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

-- ═══════════════════════════════════════════════════════════════════════
-- DECAY LOG
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS decay_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contribution_id INTEGER REFERENCES contributions(id),
  old_points INTEGER,
  new_points INTEGER,
  decay_rate REAL,
  applied_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════════════
-- REACTION POINTS (anti-gaming)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reaction_points_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL,
  reactor_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(message_id, reactor_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reaction_points_message ON reaction_points_log(message_id);
CREATE INDEX IF NOT EXISTS idx_reaction_points_author_date ON reaction_points_log(author_id, created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- HELP WANTED PINGER
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS help_wanted_pinged (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL UNIQUE,
  channel_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  pinged_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_help_wanted_message ON help_wanted_pinged(message_id);
