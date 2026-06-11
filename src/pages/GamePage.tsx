import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StatCard from '../components/StatCard'
import Pagination from '../components/Pagination'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { resolveGameImage } from '../lib/avatar'
import type { CoopResult } from '../types'

const PAGE_SIZE = 10

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function QuoteOutcome({ victorNames, coopResult }: { victorNames: string | null; coopResult: CoopResult | null }) {
  if (coopResult === 'win')  return <span className="text-blue-300">Co-op Victory</span>
  if (coopResult === 'loss') return <span className="text-red-400">Co-op Defeat</span>
  if (victorNames) {
    return <span className="text-tavern-gold">{victorNames.split(',').join(' & ')} won</span>
  }
  return null
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const { data: stats, loading, error } = useApi(() => api.games.stats(id!), id!)

  const [quotePage, setQuotePage] = useState(1)

  const isCooperative = stats?.game.type === 'cooperative'

  const totalQuotePages = stats ? Math.ceil(stats.quotes.length / PAGE_SIZE) : 1

  const pagedQuotes = useMemo(() => {
    if (!stats) return []
    return stats.quotes.slice((quotePage - 1) * PAGE_SIZE, quotePage * PAGE_SIZE)
  }, [stats, quotePage])

  return (
    <PageLayout>
      {loading && <LoadingSpinner message="Pulling up the records…" />}
      {error && <ErrorMessage message="Game not found." />}

      {stats && (
        <div className="flex flex-col gap-6">

          {/* ── Header: image + name ── */}
          <div className="flex items-center gap-4">
            <div
              className="shrink-0 border-2 border-blue-700 rounded-lg overflow-hidden"
              style={{ width: '72px', height: '72px' }}
            >
              <img
                src={resolveGameImage(stats.game.icon_path)}
                alt={stats.game.name}
                className="w-full h-full object-cover object-top"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-0.5">
                {isCooperative ? 'Cooperative' : 'Competitive'}
              </p>
              <h1 className="font-jacquard text-tavern-gold leading-tight" style={{ fontSize: '2.2rem' }}>
                {stats.game.name}
              </h1>
              {stats.game.description && (
                <p className="text-blue-300 text-sm mt-1">{stats.game.description}</p>
              )}
            </div>
          </div>

          {/* ── Top stats ── */}
          {isCooperative ? (
            <div className="flex gap-3">
              <StatCard value={stats.total_sessions} label="Sessions" />
              <StatCard value={stats.coop_wins} label="Victories" />
              <StatCard value={stats.coop_losses} label="Defeats" />
            </div>
          ) : (
            <div className="flex gap-3">
              <StatCard value={stats.total_sessions} label="Sessions" />
            </div>
          )}

          {/* ── Leaderboard — competitive only ── */}
          {!isCooperative && stats.top_players.length > 0 && (
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">Leaderboard</p>
              <div className="bg-[#060a23]/80 border border-blue-900/60 rounded-lg divide-y divide-blue-900/40">
                {stats.top_players.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-blue-500 text-sm tabular-nums w-5 text-right">{i + 1}</span>
                    <Link to={`/players/${p.id}`} className="text-tavern-amber text-sm flex-1">
                      {p.display_name ?? p.name}
                    </Link>
                    <div className="flex gap-4 text-xs text-blue-400 tabular-nums">
                      <span>{p.wins} wins</span>
                      <span>{p.sessions} played</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Quotes — all, date sorted, paginated ── */}
          {stats.quotes.length > 0 && (
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">
                Quotes ({stats.quotes.length})
              </p>
              <div className="flex flex-col gap-2">
                {pagedQuotes.map(q => (
                  <Link
                    key={q.session_id}
                    to={`/sessions/${q.session_id}`}
                    className="block bg-[#060a23]/80 border border-blue-900/60 rounded-lg p-4 hover:border-blue-700 transition-colors overflow-hidden"
                  >
                    <p className="text-blue-100 text-sm italic leading-snug line-clamp-2 break-words">
                      "{q.quote}"
                    </p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-xs truncate">
                        <QuoteOutcome victorNames={q.victor_names} coopResult={q.coop_result} />
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-blue-500 text-xs">{formatDate(q.date)}</span>
                        <span className="text-blue-500 text-sm">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination page={quotePage} totalPages={totalQuotePages} onPage={setQuotePage} />
            </div>
          )}

          {stats.total_sessions === 0 && (
            <p className="text-blue-500 text-sm italic text-center py-8">
              No sessions recorded for this game yet.
            </p>
          )}

        </div>
      )}
    </PageLayout>
  )
}
