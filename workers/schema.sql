-- Hall of Heroes D1 schema
-- Run with: npm run db:migrate (local) or npm run db:migrate:remote (production)

CREATE TABLE IF NOT EXISTS players (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  display_name TEXT,
  avatar_url   TEXT
);

CREATE TABLE IF NOT EXISTS games (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  -- 'competitive' | 'cooperative'
  type        TEXT NOT NULL CHECK(type IN ('competitive', 'cooperative')),
  icon_path   TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id               TEXT PRIMARY KEY,
  game_id          TEXT NOT NULL REFERENCES games(id),
  date             TEXT NOT NULL,   -- ISO date string YYYY-MM-DD
  quote            TEXT,
  -- 'win' | 'loss' | 'in_progress' | null
  --   'in_progress' = ongoing campaign session (no result yet)
  --   null          = not applicable (competitive game)
  coop_result      TEXT CHECK(coop_result IN ('win', 'loss', 'in_progress', NULL)),
  notes            TEXT,
  -- 1 if this session was recorded retroactively before the app existed.
  -- Legacy sessions only track who participated; non-winning player scores
  -- are absent and should not be displayed as 0.
  is_legacy        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL
);

-- Many-to-many join between sessions and players.
-- is_winner supports ties: multiple players can have is_winner = 1.
-- For co-op sessions all players are effectively co-winners — is_winner
-- is only meaningful for competitive sessions.
CREATE TABLE IF NOT EXISTS session_players (
  session_id TEXT NOT NULL REFERENCES sessions(id),
  player_id  TEXT NOT NULL REFERENCES players(id),
  score      REAL,
  is_winner  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, player_id)
);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_sessions_game    ON sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date    ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sp_player        ON session_players(player_id);
CREATE INDEX IF NOT EXISTS idx_sp_session       ON session_players(session_id);
CREATE INDEX IF NOT EXISTS idx_sp_winner        ON session_players(session_id, is_winner);

CREATE TABLE IF NOT EXISTS trivia_scores (
  date        TEXT NOT NULL,
  player_id   TEXT NOT NULL REFERENCES players(id),
  score       INTEGER NOT NULL DEFAULT 0,
  q1_correct  INTEGER NOT NULL DEFAULT 0,
  q2_correct  INTEGER NOT NULL DEFAULT 0,
  q3_correct  INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT NOT NULL,
  PRIMARY KEY (date, player_id)
);

CREATE INDEX IF NOT EXISTS idx_trivia_date ON trivia_scores(date);

-- ── Migrations (run manually against existing databases) ──────────────────
-- If your DB was created before these columns existed, run these:
--
-- Add is_legacy (sessions):
--   wrangler d1 execute hall-of-heroes-db --local  --command "ALTER TABLE sessions ADD COLUMN is_legacy INTEGER NOT NULL DEFAULT 0"
--   wrangler d1 execute hall-of-heroes-db --remote --command "ALTER TABLE sessions ADD COLUMN is_legacy INTEGER NOT NULL DEFAULT 0"
--
-- Add is_winner (session_players):
--   wrangler d1 execute hall-of-heroes-db --local  --command "ALTER TABLE session_players ADD COLUMN is_winner INTEGER NOT NULL DEFAULT 0"
--   wrangler d1 execute hall-of-heroes-db --remote --command "ALTER TABLE session_players ADD COLUMN is_winner INTEGER NOT NULL DEFAULT 0"
--
-- victor_player_id has been removed. For existing DBs it will simply be
-- ignored by queries — no DROP COLUMN needed in SQLite.
--
-- Add trivia_scores table:
--   wrangler d1 execute hall-of-heroes-db --local  --command "CREATE TABLE IF NOT EXISTS trivia_scores (date TEXT NOT NULL, player_id TEXT NOT NULL REFERENCES players(id), score INTEGER NOT NULL DEFAULT 0, q1_correct INTEGER NOT NULL DEFAULT 0, q2_correct INTEGER NOT NULL DEFAULT 0, q3_correct INTEGER NOT NULL DEFAULT 0, submitted_at TEXT NOT NULL, PRIMARY KEY (date, player_id))"
--   wrangler d1 execute hall-of-heroes-db --remote --command "CREATE TABLE IF NOT EXISTS trivia_scores (date TEXT NOT NULL, player_id TEXT NOT NULL REFERENCES players(id), score INTEGER NOT NULL DEFAULT 0, q1_correct INTEGER NOT NULL DEFAULT 0, q2_correct INTEGER NOT NULL DEFAULT 0, q3_correct INTEGER NOT NULL DEFAULT 0, submitted_at TEXT NOT NULL, PRIMARY KEY (date, player_id))"
