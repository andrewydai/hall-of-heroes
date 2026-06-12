import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'
import type { D1Database, Fetcher } from '@cloudflare/workers-types'
import type { CreateSessionPayload } from '../../src/types/index'

type Bindings = {
  DB: D1Database
  PASSCODE: string
  ADMIN_PASSCODE: string
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

const requireAuth: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const session = getCookie(c, 'hoh_session')
  if (session !== 'authenticated') {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

const requireAdmin: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const session = getCookie(c, 'hoh_admin_session')
  if (session !== 'authenticated') {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------

app.post('/auth/login', async (c) => {
  const { passcode } = await c.req.json<{ passcode: string }>()
  if (passcode !== c.env.PASSCODE?.trim()) {
    return c.json({ error: 'Wrong passcode' }, 401)
  }
  setCookie(c, 'hoh_session', 'authenticated', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.req.url.startsWith('https'),
    maxAge: 60 * 60 * 24 * 30,
  })
  return c.json({ ok: true })
})

app.get('/auth/me', requireAuth, (c) => c.json({ ok: true }))

app.post('/auth/logout', (c) => {
  setCookie(c, 'hoh_session', '', { maxAge: 0 })
  return c.json({ ok: true })
})

app.post('/auth/admin-login', async (c) => {
  const { passcode } = await c.req.json<{ passcode: string }>()
  if (passcode !== c.env.ADMIN_PASSCODE?.trim()) {
    return c.json({ error: 'Wrong passcode' }, 401)
  }
  setCookie(c, 'hoh_admin_session', 'authenticated', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.req.url.startsWith('https'),
    maxAge: 60 * 60 * 24 * 7,
  })
  return c.json({ ok: true })
})

app.get('/auth/admin-me', requireAdmin, (c) => c.json({ ok: true }))

app.post('/auth/admin-logout', (c) => {
  setCookie(c, 'hoh_admin_session', '', { maxAge: 0 })
  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Admin — Players CRUD
// ---------------------------------------------------------------------------

app.post('/admin/players', requireAdmin, async (c) => {
  const { name, display_name, avatar_url } = await c.req.json<{
    name: string; display_name?: string; avatar_url?: string
  }>()
  const id = `player-${slugify(name)}`
  await c.env.DB.prepare(
    'INSERT INTO players (id, name, display_name, avatar_url) VALUES (?, ?, ?, ?)'
  ).bind(id, name.trim(), display_name?.trim() || null, avatar_url?.trim() || null).run()
  return c.json({ id }, 201)
})

app.put('/admin/players/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const { name, display_name, avatar_url } = await c.req.json<{
    name: string; display_name?: string; avatar_url?: string
  }>()
  await c.env.DB.prepare(
    'UPDATE players SET name = ?, display_name = ?, avatar_url = ? WHERE id = ?'
  ).bind(name.trim(), display_name?.trim() || null, avatar_url?.trim() || null, id).run()
  return c.json({ ok: true })
})

app.delete('/admin/players/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM session_players WHERE player_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM players WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Admin — Games CRUD
// ---------------------------------------------------------------------------

app.post('/admin/games', requireAdmin, async (c) => {
  const { name, type, description, icon_path } = await c.req.json<{
    name: string; type: string; description?: string; icon_path?: string
  }>()
  const id = `game-${slugify(name)}`
  await c.env.DB.prepare(
    'INSERT INTO games (id, name, type, icon_path, description) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, name.trim(), type, icon_path?.trim() || null, description?.trim() || null).run()
  return c.json({ id }, 201)
})

app.put('/admin/games/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const { name, type, description, icon_path } = await c.req.json<{
    name: string; type: string; description?: string; icon_path?: string
  }>()
  await c.env.DB.prepare(
    'UPDATE games SET name = ?, type = ?, icon_path = ?, description = ? WHERE id = ?'
  ).bind(name.trim(), type, icon_path?.trim() || null, description?.trim() || null, id).run()
  return c.json({ ok: true })
})

app.delete('/admin/games/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    'SELECT COUNT(*) as n FROM sessions WHERE game_id = ?'
  ).bind(id).first<{ n: number }>()
  if (row && row.n > 0) {
    return c.json({ error: `Game has ${row.n} session(s) — delete those first.` }, 409)
  }
  await c.env.DB.prepare('DELETE FROM games WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Admin — Sessions CRUD
// ---------------------------------------------------------------------------

app.put('/admin/sessions/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const { date, quote, notes, coop_result } = await c.req.json<{
    date: string; quote?: string; notes?: string; coop_result?: string
  }>()
  await c.env.DB.prepare(
    'UPDATE sessions SET date = ?, quote = ?, notes = ?, coop_result = ? WHERE id = ?'
  ).bind(date, quote?.trim() || null, notes?.trim() || null, coop_result || null, id).run()
  return c.json({ ok: true })
})

app.delete('/admin/sessions/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM session_players WHERE session_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

app.get('/players', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM players ORDER BY name').all()
  return c.json(results)
})

app.get('/players/leaderboard', async (c) => {
  // All players with their competitive win totals
  const { results: playerRows } = await c.env.DB.prepare(`
    SELECT
      p.id, p.name, p.display_name, p.avatar_url,
      COALESCE(SUM(CASE WHEN sp.is_winner = 1 AND g.type = 'competitive' THEN 1 ELSE 0 END), 0) AS total_wins
    FROM players p
    LEFT JOIN session_players sp ON sp.player_id = p.id
    LEFT JOIN sessions s         ON s.id = sp.session_id
    LEFT JOIN games g            ON g.id = s.game_id
    GROUP BY p.id
    ORDER BY p.name
  `).all<{ id: string; name: string; display_name: string | null; avatar_url: string | null; total_wins: number }>()

  // Per-game competitive win counts for every player
  const { results: gameWinRows } = await c.env.DB.prepare(`
    SELECT sp.player_id, g.id AS game_id, g.name AS game_name, COUNT(*) AS wins
    FROM session_players sp
    JOIN sessions s ON s.id = sp.session_id
    JOIN games g    ON g.id = s.game_id
    WHERE sp.is_winner = 1 AND g.type = 'competitive'
    GROUP BY sp.player_id, g.id
  `).all<{ player_id: string; game_id: string; game_name: string; wins: number }>()

  // Index game wins by player_id
  const gameWinsByPlayer = new Map<string, Array<{ game_id: string; game_name: string; wins: number }>>()
  for (const row of gameWinRows) {
    const arr = gameWinsByPlayer.get(row.player_id) ?? []
    arr.push({ game_id: row.game_id, game_name: row.game_name, wins: row.wins })
    gameWinsByPlayer.set(row.player_id, arr)
  }

  return c.json(playerRows.map(p => ({
    ...p,
    game_wins: gameWinsByPlayer.get(p.id) ?? [],
  })))
})

app.get('/players/:id', async (c) => {
  const player = await c.env.DB.prepare('SELECT * FROM players WHERE id = ?')
    .bind(c.req.param('id'))
    .first()
  if (!player) return c.json({ error: 'Not found' }, 404)
  return c.json(player)
})

app.get('/players/:id/stats', async (c) => {
  const id = c.req.param('id')

  const player = await c.env.DB.prepare('SELECT * FROM players WHERE id = ?').bind(id).first()
  if (!player) return c.json({ error: 'Not found' }, 404)

  // Fetch all sessions for this player, including their own is_winner flag
  // and the comma-separated winner names for display.
  const { results: sessionRows } = await c.env.DB.prepare(`
    SELECT s.id, s.date, s.quote, s.coop_result, s.is_legacy,
           g.id as game_id, g.name as game_name, g.type as game_type, g.icon_path as game_icon_path,
           sp_self.is_winner,
           GROUP_CONCAT(
             CASE WHEN sp_w.is_winner = 1
               THEN COALESCE(p_w.display_name, p_w.name)
               ELSE NULL END
           ) as victor_names
    FROM session_players sp_self
    JOIN sessions s        ON s.id  = sp_self.session_id
    JOIN games g           ON g.id  = s.game_id
    -- all participants to find winners
    LEFT JOIN session_players sp_w ON sp_w.session_id = s.id AND sp_w.is_winner = 1
    LEFT JOIN players p_w          ON p_w.id = sp_w.player_id
    WHERE sp_self.player_id = ?
    GROUP BY s.id
    ORDER BY s.date DESC
  `).bind(id).all()

  const total              = sessionRows.length
  const wins               = sessionRows.filter(s => s.is_winner === 1).length
  const coopSessions       = sessionRows.filter(s => s.game_type === 'cooperative')
  const coopWins           = coopSessions.filter(s => s.coop_result === 'win').length
  const coopLosses         = coopSessions.filter(s => s.coop_result === 'loss').length
  const competitiveSessions = sessionRows.filter(s => s.game_type === 'competitive')
  const winRate            = competitiveSessions.length > 0 ? wins / competitiveSessions.length : 0

  const [gamesPlayedResult, rivalRow, opponentsRow, countsRow] = await Promise.all([
    c.env.DB.prepare(`
      SELECT g.id as game_id, g.name as game_name,
             COUNT(*) as sessions,
             SUM(sp.is_winner) as wins
      FROM session_players sp
      JOIN sessions s ON s.id = sp.session_id
      JOIN games g    ON g.id = s.game_id
      WHERE sp.player_id = ?
      GROUP BY g.id
      ORDER BY sessions DESC
    `).bind(id).all<{ game_id: string; game_name: string; sessions: number; wins: number }>(),

    // Who has beaten this player the most in competitive sessions?
    c.env.DB.prepare(`
      SELECT sp_rival.player_id as rival_id,
             p2.name             as rival_name,
             p2.display_name     as rival_display_name,
             COUNT(*)            as loss_count
      FROM sessions s
      JOIN games g         ON g.id = s.game_id AND g.type = 'competitive'
      JOIN session_players sp_self
        ON sp_self.session_id = s.id AND sp_self.player_id = ? AND sp_self.is_winner = 0
      JOIN session_players sp_rival
        ON sp_rival.session_id = s.id AND sp_rival.is_winner = 1 AND sp_rival.player_id != ?
      JOIN players p2 ON p2.id = sp_rival.player_id
      GROUP BY sp_rival.player_id
      ORDER BY loss_count DESC
      LIMIT 1
    `).bind(id, id).first<{
      rival_id: string; rival_name: string; rival_display_name: string | null; loss_count: number
    }>(),

    // How many unique opponents has this player shared a session with?
    c.env.DB.prepare(`
      SELECT COUNT(DISTINCT sp2.player_id) as unique_opponents
      FROM session_players sp1
      JOIN session_players sp2
        ON sp2.session_id = sp1.session_id AND sp2.player_id != ?
      WHERE sp1.player_id = ?
    `).bind(id, id).first<{ unique_opponents: number }>(),

    // Total games and players in the DB (for Ironclad and Socialite thresholds)
    c.env.DB.prepare(`
      SELECT (SELECT COUNT(*) FROM games) AS total_games,
             (SELECT COUNT(*) FROM players) AS total_players
    `).first<{ total_games: number; total_players: number }>(),
  ])

  const rival = rivalRow && rivalRow.loss_count >= 3
    ? { id: rivalRow.rival_id, name: rivalRow.rival_name, display_name: rivalRow.rival_display_name, loss_count: rivalRow.loss_count }
    : null

  return c.json({
    player,
    total_sessions: total,
    wins,
    win_rate: winRate,
    coop_wins: coopWins,
    coop_losses: coopLosses,
    games_played: gamesPlayedResult.results,
    sessions: sessionRows,
    rival,
    unique_opponent_count: opponentsRow?.unique_opponents ?? 0,
    total_game_count:      countsRow?.total_games   ?? 0,
    total_player_count:    countsRow?.total_players ?? 0,
  })
})

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

app.get('/games', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM games ORDER BY name').all()
  return c.json(results)
})

app.get('/games/:id', async (c) => {
  const game = await c.env.DB.prepare('SELECT * FROM games WHERE id = ?')
    .bind(c.req.param('id'))
    .first()
  if (!game) return c.json({ error: 'Not found' }, 404)
  return c.json(game)
})

app.get('/games/:id/stats', async (c) => {
  const id = c.req.param('id')

  const game = await c.env.DB.prepare('SELECT * FROM games WHERE id = ?').bind(id).first()
  if (!game) return c.json({ error: 'Not found' }, 404)

  const { results: sessions } = await c.env.DB.prepare(`
    SELECT s.id, s.date, s.quote, s.coop_result,
           GROUP_CONCAT(
             CASE WHEN sp.is_winner = 1
               THEN COALESCE(p.display_name, p.name)
               ELSE NULL END
           ) as victor_names,
           GROUP_CONCAT(
             CASE WHEN sp.is_winner = 1
               THEN COALESCE(p.avatar_url, 'unknown_player')
               ELSE NULL END
           ) as victor_avatars
    FROM sessions s
    LEFT JOIN session_players sp ON sp.session_id = s.id
    LEFT JOIN players p          ON p.id = sp.player_id
    WHERE s.game_id = ?
    GROUP BY s.id
    ORDER BY s.date DESC
  `).bind(id).all()

  const coopWins   = sessions.filter(s => s.coop_result === 'win').length
  const coopLosses = sessions.filter(s => s.coop_result === 'loss').length

  const { results: topPlayers } = await c.env.DB.prepare(`
    SELECT p.id, p.name, p.display_name,
           COUNT(*) as sessions,
           SUM(sp.is_winner) as wins
    FROM session_players sp
    JOIN sessions s ON s.id = sp.session_id
    JOIN games g    ON g.id = s.game_id
    JOIN players p  ON p.id = sp.player_id
    WHERE s.game_id = ? AND g.type = 'competitive'
    GROUP BY p.id
    ORDER BY wins DESC
    LIMIT 10
  `).bind(id).all()

  const quotes = sessions
    .filter(s => s.quote)
    .map(s => ({
      quote: s.quote,
      session_id: s.id,
      date: s.date,
      victor_names: s.victor_names ?? null,
      victor_avatars: s.victor_avatars ?? null,
      coop_result: s.coop_result ?? null,
    }))

  return c.json({
    game,
    total_sessions: sessions.length,
    top_players: topPlayers,
    coop_wins: coopWins,
    coop_losses: coopLosses,
    quotes,
  })
})

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

app.get('/sessions', async (c) => {
  const limit = Number(c.req.query('limit') ?? 20)
  const { results } = await c.env.DB.prepare(`
    SELECT s.id, s.date, s.quote, s.coop_result,
           g.name as game_name,
           GROUP_CONCAT(
             CASE WHEN sp.is_winner = 1
               THEN COALESCE(p.display_name, p.name)
               ELSE NULL END
           ) as victor_names
    FROM sessions s
    JOIN games g ON g.id = s.game_id
    LEFT JOIN session_players sp ON sp.session_id = s.id
    LEFT JOIN players p          ON p.id = sp.player_id
    GROUP BY s.id
    ORDER BY s.date DESC
    LIMIT ?
  `).bind(limit).all()
  return c.json(results)
})

app.get('/sessions/:id', async (c) => {
  const id = c.req.param('id')

  const session = await c.env.DB.prepare(`
    SELECT s.*, g.name as game_name, g.type as game_type, g.icon_path
    FROM sessions s
    JOIN games g ON g.id = s.game_id
    WHERE s.id = ?
  `).bind(id).first()

  if (!session) return c.json({ error: 'Not found' }, 404)

  const { results: players } = await c.env.DB.prepare(`
    SELECT sp.score, sp.is_winner, p.id, p.name, p.display_name, p.avatar_url
    FROM session_players sp
    JOIN players p ON p.id = sp.player_id
    WHERE sp.session_id = ?
    ORDER BY sp.is_winner DESC, sp.score DESC
  `).bind(id).all()

  return c.json({ ...session, players })
})

app.post('/sessions', requireAuth, async (c) => {
  const body = await c.req.json<CreateSessionPayload>()

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()

  await c.env.DB.prepare(`
    INSERT INTO sessions (id, game_id, date, quote, coop_result, notes, is_legacy, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).bind(id, body.game_id, body.date, body.quote, body.coop_result, body.notes, now).run()

  for (const { player_id, score, is_winner } of body.players) {
    await c.env.DB.prepare(
      'INSERT INTO session_players (session_id, player_id, score, is_winner) VALUES (?, ?, ?, ?)'
    ).bind(id, player_id, score ?? null, is_winner ? 1 : 0).run()
  }

  return c.json({ id }, 201)
})

// ---------------------------------------------------------------------------
// Trivia helpers
// ---------------------------------------------------------------------------

function getTodayEST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

function getDayIndex(dateStr: string): number {
  const epoch = new Date('2024-01-01T00:00:00-05:00').getTime()
  const today = new Date(dateStr + 'T00:00:00-05:00').getTime()
  return Math.max(0, Math.floor((today - epoch) / 86400000))
}

function dateSeed(dateStr: string): number {
  return parseInt(dateStr.replace(/-/g, ''), 10)
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = ((Math.imul(s, 1664525) + 1013904223) >>> 0)
    return s / 4294967296
  }
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = makeRng(seed)
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function seededPick<T>(arr: T[], count: number, seed: number): T[] {
  return seededShuffle(arr, seed).slice(0, count)
}

function formatTriviaDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

type TriviaSession = {
  id: string; quote: string; date: string; coop_result: string | null
  game_id: string; game_name: string; game_type: string; victor_names: string | null
}

async function getTodayTriviaSession(db: D1Database): Promise<{ session: TriviaSession; today: string } | null> {
  const today  = getTodayEST()
  const dayIdx = getDayIndex(today)

  const { results } = await db.prepare(`
    SELECT s.id, s.quote, s.date, s.coop_result,
           g.id   AS game_id,
           g.name AS game_name,
           g.type AS game_type,
           GROUP_CONCAT(
             CASE WHEN sp.is_winner = 1
               THEN COALESCE(p.display_name, p.name)
               ELSE NULL END
           ) AS victor_names
    FROM sessions s
    JOIN games g            ON g.id  = s.game_id
    JOIN session_players sp ON sp.session_id = s.id
    JOIN players p          ON p.id  = sp.player_id
    WHERE s.quote IS NOT NULL AND s.quote != ''
      AND NOT (g.type = 'cooperative'
               AND (s.coop_result IS NULL OR s.coop_result = 'in_progress'))
    GROUP BY s.id
    ORDER BY s.id
  `).all<TriviaSession>()

  if (results.length === 0) return null
  return { session: results[dayIdx % results.length], today }
}

// ---------------------------------------------------------------------------
// Trivia routes
// ---------------------------------------------------------------------------

app.get('/trivia/today', async (c) => {
  const db   = c.env.DB
  const data = await getTodayTriviaSession(db)
  if (!data) return c.json({ error: 'No trivia sessions available' }, 404)

  const { session, today } = data
  const seed = dateSeed(today)

  // Q1: game choices — correct + 2 wrong from other games
  const { results: allGames } = await db.prepare(
    'SELECT id, name FROM games WHERE id != ? ORDER BY id'
  ).bind(session.game_id).all<{ id: string; name: string }>()

  const wrongGames = seededPick(allGames, 2, seed + 1)
  const q1Choices = seededShuffle([
    { value: session.game_id, label: session.game_name },
    ...wrongGames.map(g => ({ value: g.id, label: g.name })),
  ], seed + 10)

  // Q2: victor / coop result choices
  let q2Choices: Array<{ value: string; label: string }>

  if (session.game_type === 'cooperative') {
    q2Choices = seededShuffle([
      { value: 'win',         label: 'Victory'     },
      { value: 'loss',        label: 'Defeat'      },
      { value: 'in_progress', label: 'In Progress' },
    ], seed + 20)
  } else {
    const victorLabel = (session.victor_names ?? '')
      .split(',').map((n: string) => n.trim()).filter(Boolean).join(' & ')

    const { results: allPlayers } = await db.prepare(
      'SELECT COALESCE(display_name, name) AS label FROM players ORDER BY id'
    ).all<{ label: string }>()

    const winnerSet = new Set(
      (session.victor_names ?? '').split(',').map((n: string) => n.trim()).filter(Boolean)
    )
    const wrongPlayers = seededPick(allPlayers.filter(p => !winnerSet.has(p.label)), 2, seed + 21)

    q2Choices = seededShuffle([
      { value: victorLabel, label: victorLabel },
      ...wrongPlayers.map(p => ({ value: p.label, label: p.label })),
    ], seed + 20)
  }

  // Q3: date choices — correct + 2 wrong from other session dates
  const { results: otherDates } = await db.prepare(
    'SELECT DISTINCT date FROM sessions WHERE id != ? ORDER BY id'
  ).bind(session.id).all<{ date: string }>()

  const wrongDates = seededPick(otherDates, 2, seed + 3)
  const q3Choices = seededShuffle([
    { value: session.date, label: formatTriviaDate(session.date) },
    ...wrongDates.map(d => ({ value: d.date, label: formatTriviaDate(d.date) })),
  ], seed + 30)

  return c.json({
    date:        today,
    quote:       session.quote,
    game_type:   session.game_type,
    coop_result: session.coop_result,
    q1_choices:  q1Choices,
    q2_choices:  q2Choices,
    q3_choices:  q3Choices,
  })
})

app.get('/trivia/status/:player_id', async (c) => {
  const player_id = c.req.param('player_id')
  const today     = getTodayEST()

  const row = await c.env.DB.prepare(
    'SELECT score, q1_correct, q2_correct, q3_correct FROM trivia_scores WHERE date = ? AND player_id = ?'
  ).bind(today, player_id).first<{ score: number; q1_correct: number; q2_correct: number; q3_correct: number }>()

  return c.json({
    played:     !!row,
    score:      row?.score      ?? null,
    q1_correct: row?.q1_correct ?? null,
    q2_correct: row?.q2_correct ?? null,
    q3_correct: row?.q3_correct ?? null,
  })
})

app.post('/trivia/submit', async (c) => {
  const { player_id, q1, q2, q3 } = await c.req.json<{
    player_id: string; q1: string; q2: string; q3: string
  }>()

  const db    = c.env.DB
  const today = getTodayEST()

  const existing = await db.prepare(
    'SELECT 1 FROM trivia_scores WHERE date = ? AND player_id = ?'
  ).bind(today, player_id).first()
  if (existing) return c.json({ error: 'Already submitted for today' }, 409)

  const data = await getTodayTriviaSession(db)
  if (!data) return c.json({ error: 'No trivia available' }, 404)
  const { session } = data

  const correctQ2 = session.game_type === 'cooperative'
    ? (session.coop_result ?? '')
    : (session.victor_names ?? '').split(',').map((n: string) => n.trim()).filter(Boolean).join(' & ')

  const q1c   = q1 === session.game_id ? 1 : 0
  const q2c   = q2 === correctQ2       ? 1 : 0
  const q3c   = q3 === session.date    ? 1 : 0
  const score = q1c + q2c + q3c

  await db.prepare(`
    INSERT INTO trivia_scores (date, player_id, score, q1_correct, q2_correct, q3_correct, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(today, player_id, score, q1c, q2c, q3c, new Date().toISOString()).run()

  return c.json({
    score,
    q1_correct: q1c === 1,
    q2_correct: q2c === 1,
    q3_correct: q3c === 1,
    correct: { q1: session.game_id, q2: correctQ2, q3: session.date },
  })
})

app.get('/trivia/leaderboard', async (c) => {
  const today = getTodayEST()

  const { results } = await c.env.DB.prepare(`
    SELECT ts.player_id, ts.score, ts.q1_correct, ts.q2_correct, ts.q3_correct,
           ts.submitted_at, p.name, p.display_name, p.avatar_url
    FROM trivia_scores ts
    JOIN players p ON p.id = ts.player_id
    WHERE ts.date = ?
    ORDER BY ts.score DESC, ts.submitted_at ASC
  `).bind(today).all()

  return c.json(results)
})

// Root app: mount API routes under /api, then fall through to static assets
// for all React Router client-side routes (e.g. /sessions, /players/:id).
const root = new Hono<{ Bindings: Bindings }>()
root.route('/api', app)
root.get('*', (c) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw)
  return c.notFound()
})

export default root
