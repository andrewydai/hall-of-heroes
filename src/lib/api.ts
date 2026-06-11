import type {
  Player, Game, SessionSummary, SessionWithDetails,
  PlayerStats, PlayerLeaderboardEntry, GameStats, CreateSessionPayload,
  TriviaToday, TriviaStatus, TriviaResult, TriviaLeaderboardEntry,
} from '../types'

const BASE = '/api'

// Typed error so callers can check err.status for 401 vs network failures
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include', // send the session cookie automatically
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    throw new ApiError(res.status, body.error ?? res.statusText)
  }

  return res.json() as Promise<T>
}

export const api = {
  auth: {
    // Returns { ok: true } if the session cookie is valid, 401 otherwise
    me: () => apiFetch<{ ok: boolean }>('/auth/me'),
    login: (passcode: string) =>
      apiFetch<{ ok: boolean }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      }),
    logout: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  },

  players: {
    list: () => apiFetch<Player[]>('/players'),
    leaderboard: () => apiFetch<PlayerLeaderboardEntry[]>('/players/leaderboard'),
    get: (id: string) => apiFetch<Player>(`/players/${id}`),
    stats: (id: string) => apiFetch<PlayerStats>(`/players/${id}/stats`),
  },

  games: {
    list: () => apiFetch<Game[]>('/games'),
    get: (id: string) => apiFetch<Game>(`/games/${id}`),
    stats: (id: string) => apiFetch<GameStats>(`/games/${id}/stats`),
  },

  sessions: {
    list: (limit = 20) => apiFetch<SessionSummary[]>(`/sessions?limit=${limit}`),
    get: (id: string) => apiFetch<SessionWithDetails>(`/sessions/${id}`),
    create: (payload: CreateSessionPayload) =>
      apiFetch<{ id: string }>('/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  trivia: {
    today: () => apiFetch<TriviaToday>('/trivia/today'),
    status: (playerId: string) => apiFetch<TriviaStatus>(`/trivia/status/${playerId}`),
    submit: (payload: { player_id: string; q1: string; q2: string; q3: string }) =>
      apiFetch<TriviaResult>('/trivia/submit', { method: 'POST', body: JSON.stringify(payload) }),
    leaderboard: () => apiFetch<TriviaLeaderboardEntry[]>('/trivia/leaderboard'),
  },

  admin: {
    auth: {
      me:     () => apiFetch<{ ok: boolean }>('/auth/admin-me'),
      login:  (passcode: string) =>
        apiFetch<{ ok: boolean }>('/auth/admin-login', {
          method: 'POST', body: JSON.stringify({ passcode }),
        }),
      logout: () => apiFetch<{ ok: boolean }>('/auth/admin-logout', { method: 'POST' }),
    },
    players: {
      create: (data: { name: string; display_name?: string; avatar_url?: string }) =>
        apiFetch<{ id: string }>('/admin/players', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: { name: string; display_name?: string; avatar_url?: string }) =>
        apiFetch<{ ok: boolean }>(`/admin/players/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) =>
        apiFetch<{ ok: boolean }>(`/admin/players/${id}`, { method: 'DELETE' }),
    },
    games: {
      create: (data: { name: string; type: string; description?: string; icon_path?: string }) =>
        apiFetch<{ id: string }>('/admin/games', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: { name: string; type: string; description?: string; icon_path?: string }) =>
        apiFetch<{ ok: boolean }>(`/admin/games/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) =>
        apiFetch<{ ok: boolean }>(`/admin/games/${id}`, { method: 'DELETE' }),
    },
    sessions: {
      update: (id: string, data: { date: string; quote?: string; notes?: string; coop_result?: string }) =>
        apiFetch<{ ok: boolean }>(`/admin/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) =>
        apiFetch<{ ok: boolean }>(`/admin/sessions/${id}`, { method: 'DELETE' }),
    },
  },
}
