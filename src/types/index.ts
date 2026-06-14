// Shared types used by both the React frontend and Cloudflare Workers API.
// Keep this file free of browser-only or Node-only imports.

export type GameType = 'competitive' | 'cooperative'

// 'in_progress' = ongoing campaign session with no result yet.
// null           = not applicable (competitive game).
export type CoopResult = 'win' | 'loss' | 'in_progress'

export interface Player {
  id: string
  name: string
  display_name: string | null
  avatar_url: string | null
}

export interface Game {
  id: string
  name: string
  type: GameType
  icon_path: string | null
  description: string | null
}

// Matches what GET /sessions returns per item (joined flat).
// victor_names is a comma-separated list of winner display names,
// supporting ties. null when there is no winner (co-op / in_progress).
export interface SessionSummary {
  id: string
  date: string
  quote: string | null
  coop_result: CoopResult | null
  game_name: string
  victor_names: string | null
}

// Matches what GET /sessions/:id returns (flat SQL join + players array).
export interface SessionWithDetails {
  id: string
  game_id: string
  date: string
  quote: string | null
  coop_result: CoopResult | null
  notes: string | null
  // true when the session was recorded retroactively. Non-winning player
  // scores will be null and should not be displayed as 0.
  is_legacy: boolean
  created_at: string
  game_name: string
  game_type: GameType
  players: Array<{
    id: string
    name: string
    display_name: string | null
    avatar_url: string | null
    score: number | null
    is_winner: boolean
  }>
}

// One session entry from GET /players/:id/stats — includes is_winner for this player.
export interface PlayerSession {
  id: string
  date: string
  quote: string | null
  game_id: string
  game_name: string
  game_type: GameType
  game_icon_path: string | null
  coop_result: CoopResult | null
  is_winner: number  // SQLite 0 | 1
  is_legacy: number  // SQLite 0 | 1
  victor_names: string | null
}

export interface RivalInfo {
  id: string
  name: string
  display_name: string | null
  loss_count: number
}

export interface PlayerBadge {
  id: string
  label: string
  tooltip: string
}

// Matches what GET /players/leaderboard returns — lightweight summary for list + sorting.
export interface PlayerLeaderboardEntry {
  id: string
  name: string
  display_name: string | null
  avatar_url: string | null
  total_wins: number
  game_wins: Array<{ game_id: string; game_name: string; wins: number }>
}

// Matches what GET /players/:id/stats returns.
export interface PlayerStats {
  player: Player
  total_sessions: number
  wins: number
  win_rate: number
  coop_wins: number
  coop_losses: number
  games_played: Array<{ game_id: string; game_name: string; sessions: number; wins: number }>
  sessions: PlayerSession[]
  rival: RivalInfo | null
  unique_opponent_count: number
  total_game_count: number
  total_player_count: number
}

// Matches what GET /games/:id/stats returns.
export interface GameStats {
  game: Game
  total_sessions: number
  top_players: Array<{ id: string; name: string; display_name: string | null; sessions: number; wins: number }>
  coop_wins: number
  coop_losses: number
  quotes: Array<{
    quote: string
    session_id: string
    date: string
    victor_names: string | null
    victor_avatars: string | null  // comma-separated avatar_url values
    coop_result: CoopResult | null
  }>
}

// Payload for creating a new session (sent from the log form to the API).
export interface CreateSessionPayload {
  game_id: string
  date: string
  quote: string | null
  coop_result: CoopResult | null
  notes: string | null
  players: Array<{ player_id: string; score: number | null; is_winner: boolean }>
}

export interface TriviaChoice {
  value: string
  label: string
}

export interface TriviaToday {
  date: string
  quote: string
  game_type: string
  coop_result: string | null
  q1_choices: TriviaChoice[]
  q2_choices: TriviaChoice[]
  q3_choices: TriviaChoice[]
}

export interface TriviaStatus {
  played: boolean
  score: number | null
  q1_correct: number | null
  q2_correct: number | null
  q3_correct: number | null
  correct: { q1: string; q2: string; q3: string } | null
}

export interface TriviaResult {
  score: number
  q1_correct: boolean
  q2_correct: boolean
  q3_correct: boolean
  correct: {
    q1: string
    q2: string
    q3: string
  }
}

export interface TriviaLeaderboardEntry {
  player_id: string
  name: string
  display_name: string | null
  avatar_url: string | null
  score: number
  q1_correct: number
  q2_correct: number
  q3_correct: number
  submitted_at: string
}
