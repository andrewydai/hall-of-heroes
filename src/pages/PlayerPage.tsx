import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StatCard from '../components/StatCard'
import BadgePip from '../components/BadgePip'
import Pagination from '../components/Pagination'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import type { PlayerSession } from '../types'
import { resolveAvatar } from '../lib/avatar'
import { computeBadges } from '../lib/badges'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatWinRate(rate: number) {
  return `${(rate * 100).toFixed(1)}%`
}

// Blue border for wins, red for losses, neutral for in-progress/unknown
function sessionBorderClass(session: PlayerSession): string {
  if (session.game_type === 'cooperative') {
    if (session.coop_result === 'win')  return 'border-blue-400'
    if (session.coop_result === 'loss') return 'border-red-500'
    return 'border-blue-900/60'
  }
  return session.is_winner ? 'border-blue-400' : 'border-red-500'
}

function SessionOutcome({ session }: { session: PlayerSession }) {
  if (session.game_type === 'cooperative') {
    if (session.coop_result === 'win')         return <span className="text-blue-300">Co-op Victory</span>
    if (session.coop_result === 'loss')        return <span className="text-red-400">Co-op Defeat</span>
    if (session.coop_result === 'in_progress') return <span className="text-blue-500">In Progress</span>
    return null
  }
  if (session.is_winner) {
    return <span className="text-blue-300">Won</span>
  }
  return (
    <span className="text-red-400">
      Lost
      {session.victor_names && (
        <span className="text-blue-500"> · {session.victor_names.split(',').join(' & ')} won</span>
      )}
    </span>
  )
}

type TypeFilter = 'all' | 'competitive' | 'cooperative'

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const { data: stats, loading, error } = useApi(() => api.players.stats(id!), id!)

  const badges = useMemo(() => stats ? computeBadges(stats) : [], [stats])

  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [filterGame, setFilterGame] = useState<string>('')
  const [sessionPage, setSessionPage] = useState(1)
  const [excludeLegacy, setExcludeLegacy] = useState(false)

  // Stats recomputed from non-legacy sessions when the toggle is on
  const displayStats = useMemo(() => {
    if (!stats) return null
    if (!excludeLegacy) return stats

    const nonLegacy = stats.sessions.filter(s => !s.is_legacy)
    const compSessions = nonLegacy.filter(s => s.game_type === 'competitive')
    const wins = compSessions.filter(s => s.is_winner).length
    const coopSessions = nonLegacy.filter(s => s.game_type === 'cooperative')
    const coopWins   = coopSessions.filter(s => s.coop_result === 'win').length
    const coopLosses = coopSessions.filter(s => s.coop_result === 'loss').length

    const gamesPlayed = stats.games_played.map(g => {
      const gSessions = nonLegacy.filter(s => s.game_id === g.game_id)
      return { ...g, sessions: gSessions.length, wins: gSessions.filter(s => s.is_winner).length }
    }).filter(g => g.sessions > 0)

    return {
      ...stats,
      total_sessions: nonLegacy.length,
      wins,
      win_rate: compSessions.length > 0 ? wins / compSessions.length : 0,
      coop_wins: coopWins,
      coop_losses: coopLosses,
      games_played: gamesPlayed,
      sessions: nonLegacy,
    }
  }, [stats, excludeLegacy])

  const filteredSessions = useMemo(() => {
    if (!displayStats) return []
    return displayStats.sessions.filter(s => {
      if (filterType !== 'all' && s.game_type !== filterType) return false
      if (filterGame && s.game_id !== filterGame) return false
      return true
    })
  }, [displayStats, filterType, filterGame])

  // Games available for the active type filter
  const gamesForFilter = useMemo(() => {
    if (!displayStats) return []
    const seen = new Set<string>()
    return displayStats.sessions
      .filter(s => filterType === 'all' || s.game_type === filterType)
      .filter(s => { if (seen.has(s.game_id)) return false; seen.add(s.game_id); return true })
      .sort((a, b) => a.game_name.localeCompare(b.game_name))
  }, [displayStats, filterType])

  const totalSessionPages = Math.ceil(filteredSessions.length / 10)
  const pagedSessions = useMemo(
    () => filteredSessions.slice((sessionPage - 1) * 10, sessionPage * 10),
    [filteredSessions, sessionPage]
  )

  function handleTypeFilter(type: TypeFilter) {
    setFilterType(type)
    setFilterGame('')
    setSessionPage(1)
  }

  return (
    <PageLayout>
      {loading && <LoadingSpinner message="Summoning the hero…" />}
      {error && <ErrorMessage message="Player not found." />}

      {stats && (
        <div className="flex flex-col gap-6">

          {/* ── Header: avatar + name ── */}
          <div className="flex items-center gap-4">
            <div
              className="shrink-0 border-2 border-blue-700 rounded-lg overflow-hidden"
              style={{ width: '72px', height: '72px' }}
            >
              <img
                src={resolveAvatar(stats.player.avatar_url)}
                alt={stats.player.display_name ?? stats.player.name}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-jacquard text-tavern-gold leading-tight" style={{ fontSize: '2.4rem' }}>
                {stats.player.display_name ?? stats.player.name}
              </h1>
              {/* Badge row */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {badges.length === 0 ? (
                  <span className="text-xs border border-blue-900 text-blue-700 rounded px-2 py-0.5">No badges yet</span>
                ) : (
                  badges.map(badge => (
                    <BadgePip key={badge.id} label={badge.label} tooltip={badge.tooltip} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Stat boxes ── */}
          <div className="flex gap-3">
            <StatCard value={displayStats!.total_sessions} label="Sessions" />
            <StatCard value={displayStats!.wins} label="Comp. Wins" />
            <StatCard value={formatWinRate(displayStats!.win_rate)} label="Win Rate" />
          </div>

          {(displayStats!.coop_wins > 0 || displayStats!.coop_losses > 0) && (
            <div className="flex gap-3">
              <StatCard value={displayStats!.coop_wins} label="Co-op Wins" />
              <StatCard value={displayStats!.coop_losses} label="Co-op Losses" />
            </div>
          )}

          {/* ── Legacy toggle ── */}
          {stats.sessions.some(s => s.is_legacy) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setExcludeLegacy(v => !v); setSessionPage(1) }}
                className={`text-xs border rounded px-2 py-1 transition-colors ${
                  excludeLegacy
                    ? 'border-tavern-gold text-tavern-gold bg-tavern-gold/10'
                    : 'border-blue-900 text-blue-400 hover:border-blue-700'
                }`}
              >
                Exclude Legacy
              </button>
              <span className="text-blue-600 text-xs">
                {excludeLegacy ? 'Legacy sessions hidden' : 'Includes retroactive sessions'}
              </span>
            </div>
          )}

          {/* ── Match history ── */}
          {displayStats!.sessions.length > 0 && (
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">
                Match History
              </p>

              {/* Filters */}
              <div className="flex flex-col gap-2 mb-3">
                {/* Type pills */}
                <div className="flex gap-2">
                  {(['all', 'competitive', 'cooperative'] as TypeFilter[]).map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeFilter(type)}
                      className={`text-xs border rounded px-2 py-1 transition-colors capitalize ${
                        filterType === type
                          ? 'border-tavern-gold text-tavern-gold bg-tavern-gold/10'
                          : 'border-blue-900 text-blue-400 hover:border-blue-700'
                      }`}
                    >
                      {type === 'all' ? 'All' : type}
                    </button>
                  ))}
                </div>

                {/* Game dropdown */}
                <select
                  value={filterGame}
                  onChange={e => { setFilterGame(e.target.value); setSessionPage(1) }}
                  className="border border-blue-900 text-blue-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-tavern-gold transition-colors"
                  style={{ background: '#030614' }}
                >
                  <option value="">All Games</option>
                  {gamesForFilter.map(g => (
                    <option key={g.game_id} value={g.game_id}>{g.game_name}</option>
                  ))}
                </select>
              </div>

              {/* Session rows */}
              {filteredSessions.length === 0 ? (
                <p className="text-blue-500 text-sm italic text-center py-6">No sessions match this filter.</p>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    {pagedSessions.map(session => (
                      <Link
                        key={session.id}
                        to={`/sessions/${session.id}`}
                        className={`block rounded-lg p-3 border bg-[#060a23]/80 hover:bg-white/5 transition-colors overflow-hidden ${sessionBorderClass(session)}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-blue-100 text-sm truncate">{session.game_name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-blue-500" style={{ fontSize: '11px' }}>{formatDate(session.date)}</span>
                            <span className="text-blue-500 text-sm">→</span>
                          </div>
                        </div>
                        <div className="mt-0.5 text-xs truncate">
                          <SessionOutcome session={session} />
                        </div>
                        {/* Always rendered so all tiles share the same 3-line height */}
                        <p className="text-blue-400 italic mt-1 line-clamp-1 break-words" style={{ fontSize: '11px' }}>
                          {session.quote ? `"${session.quote}"` : ''}
                        </p>
                      </Link>
                    ))}
                  </div>
                  <Pagination page={sessionPage} totalPages={totalSessionPages} onPage={setSessionPage} />
                </>
              )}
            </div>
          )}

          {stats.total_sessions === 0 && (
            <p className="text-blue-500 text-sm italic text-center py-8">
              No sessions recorded yet.
            </p>
          )}

        </div>
      )}
    </PageLayout>
  )
}
