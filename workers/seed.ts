/**
 * Historical data import script.
 * Usage: npm run db:seed (targets local D1)
 *        npm run db:seed:remote (targets remote D1 — add this script to package.json when ready)
 *
 * Reads from workers/seed/:
 *   players.json    — array of player objects; re-run seed to add new players
 *   games.json      — array of game objects; re-run seed to add new games
 *   sessions.json   — one-time historical import; not intended to be re-run for new sessions
 *
 * Session IDs are auto-generated as a SHA-256 hash of (game_id + date + sorted
 * player IDs + array index). This means the script is idempotent — running it
 * twice won't insert duplicate rows. IDs are stable as long as you don't reorder
 * or insert sessions in the middle of sessions.json.
 *
 * Adding new data:
 *   New player  → append to seed/players.json
 *   New game    → append to seed/games.json
 *   New session → append to the relevant seed/sessions/YYYY.json (create the file if needed)
 */

import { createHash }                from 'crypto'
import { execSync }                  from 'child_process'
import fs                            from 'fs'
import path                          from 'path'
import { fileURLToPath }             from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedDir   = path.join(__dirname, 'seed')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeedPlayer {
  id: string
  name: string
  display_name?: string
}

interface SeedGame {
  id: string
  name: string
  type: 'competitive' | 'cooperative'
  description?: string
  icon_path?: string
}

interface SeedSessionPlayer {
  player_id: string
  score?: number
  is_winner?: boolean
}

interface SeedSession {
  game_id: string
  date: string
  quote?: string
  coop_result?: 'win' | 'loss' | 'in_progress'
  notes?: string
  is_legacy?: boolean
  players: SeedSessionPlayer[]
}

// ---------------------------------------------------------------------------
// ID generation — deterministic hash so re-runs stay idempotent
// ---------------------------------------------------------------------------

function sessionId(s: SeedSession, idx: number): string {
  const sorted  = [...s.players.map(p => p.player_id)].sort().join(',')
  const input   = [s.game_id, s.date, sorted, String(idx)].join(':')
  return createHash('sha256').update(input).digest('hex').slice(0, 24)
}

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

function load<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf-8')) as T
}

const players:  SeedPlayer[] = load('players.json')
const games:    SeedGame[]   = load('games.json')
// Filter out _note separator entries (they have no game_id and are only for human readability)
const sessions: SeedSession[] = (load<Array<SeedSession | { _note: string }>>('sessions.json'))
  .filter((e): e is SeedSession => 'game_id' in e)

// ---------------------------------------------------------------------------
// Build SQL
// ---------------------------------------------------------------------------

const statements: string[] = []
const now = new Date().toISOString()

for (const p of players) {
  const display = p.display_name ? `'${p.display_name.replace(/'/g, "''")}'` : 'NULL'
  statements.push(
    `INSERT OR IGNORE INTO players (id, name, display_name) VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', ${display});`
  )
}

for (const g of games) {
  const desc     = g.description ? `'${g.description.replace(/'/g, "''")}'` : 'NULL'
  const iconPath = g.icon_path   ? `'${g.icon_path}'`                       : 'NULL'
  statements.push(
    `INSERT INTO games (id, name, type, description, icon_path) VALUES ('${g.id}', '${g.name.replace(/'/g, "''")}', '${g.type}', ${desc}, ${iconPath}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, description=excluded.description, icon_path=excluded.icon_path;`
  )
}

for (const [idx, s] of sessions.entries()) {
  const id       = sessionId(s, idx)
  const quote    = s.quote       ? `'${s.quote.replace(/'/g, "''")}'`  : 'NULL'
  const coop     = s.coop_result ? `'${s.coop_result}'`                : 'NULL'
  const notes    = s.notes       ? `'${s.notes.replace(/'/g, "''")}'`  : 'NULL'
  const isLegacy = s.is_legacy   ? 1                                   : 0

  statements.push(
    `INSERT OR IGNORE INTO sessions (id, game_id, date, quote, coop_result, notes, is_legacy, created_at) VALUES ('${id}', '${s.game_id}', '${s.date}', ${quote}, ${coop}, ${notes}, ${isLegacy}, '${now}');`
  )

  for (const sp of s.players) {
    const score    = sp.score    != null ? sp.score.toString() : 'NULL'
    const isWinner = sp.is_winner        ? 1                   : 0
    statements.push(
      `INSERT OR IGNORE INTO session_players (session_id, player_id, score, is_winner) VALUES ('${id}', '${sp.player_id}', ${score}, ${isWinner});`
    )
  }
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

const remote = process.argv.includes('--remote')
const tmpFile = path.join(__dirname, '_seed_tmp.sql')
fs.writeFileSync(tmpFile, statements.join('\n'))

console.log(`Seeding ${players.length} players, ${games.length} games, ${sessions.length} sessions… (${remote ? 'remote' : 'local'})`)
const target = remote ? '--remote' : '--local'
execSync(`npx wrangler d1 execute tabletop-tales-db ${target} --file=${tmpFile}`, { stdio: 'inherit' })

fs.unlinkSync(tmpFile)
console.log('Done.')
