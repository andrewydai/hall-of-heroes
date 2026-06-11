import { Link, useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: session, loading, error } = useApi(() => api.sessions.get(id!), id!)

  return (
    <PageLayout>
      {loading && <LoadingSpinner message="Loading session…" />}
      {error && <ErrorMessage message="Session not found." />}

      {session && (
        <div className="flex flex-col gap-6">

          {/* Quote — the centerpiece */}
          {session.quote ? (
            <div className="bg-[#060a23]/80 border border-blue-900/60 rounded-lg p-6 text-center">
              <p className="text-blue-100 text-lg italic leading-relaxed whitespace-pre-line break-words">
                "{session.quote}"
              </p>
            </div>
          ) : (
            <div className="border border-dashed border-blue-900/40 rounded-lg p-6 text-center">
              <p className="text-blue-500 text-sm italic">No quote recorded.</p>
            </div>
          )}

          {/* Session meta */}
          <div className="bg-[#060a23]/80 border border-blue-900/60 rounded-lg divide-y divide-blue-900/40">
            <Row label="Game">
              <Link to={`/games/${session.game_id}`} className="text-tavern-amber flex items-center gap-1.5">
                {session.game_name}
                <span className="text-blue-500">→</span>
              </Link>
            </Row>
            <Row label="Date">
              <span className="text-blue-100">{formatDate(session.date)}</span>
            </Row>
            {(() => {
              const winners = session.players.filter(p => p.is_winner)
              if (winners.length === 0) return null
              return (
                <Row label={winners.length > 1 ? 'Winners' : 'Victor'}>
                  <span className="flex gap-2 flex-wrap justify-end">
                    {winners.map(w => (
                      <Link key={w.id} to={`/players/${w.id}`} className="text-tavern-gold font-semibold">
                        {w.display_name ?? w.name}
                      </Link>
                    ))}
                  </span>
                </Row>
              )
            })()}
            {session.coop_result && (
              <Row label="Result">
                <span className={
                  session.coop_result === 'win'  ? 'text-green-400' :
                  session.coop_result === 'loss' ? 'text-red-400'   :
                  'text-blue-400'
                }>
                  {session.coop_result === 'win'         ? 'Co-op Victory' :
                   session.coop_result === 'loss'        ? 'Co-op Defeat'  :
                   'In Progress'}
                </span>
              </Row>
            )}
          </div>

          {/* Players */}
          {session.players.length > 0 && (
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">
                Players
              </p>
              <div className="flex flex-col gap-1.5">
                {session.players.map(p => (
                  <Link
                    key={p.id}
                    to={`/players/${p.id}`}
                    className={`flex items-center justify-between rounded px-3 py-2 border hover:border-blue-700 transition-colors ${
                      p.is_winner
                        ? 'bg-white/10 border-tavern-gold'
                        : 'bg-[#060a23]/80 border-blue-900/60'
                    }`}
                  >
                    <span className={`text-sm ${p.is_winner ? 'text-tavern-gold font-semibold' : 'text-blue-300'}`}>
                      {p.is_winner ? <span className="mr-1.5">★</span> : null}
                      {p.display_name ?? p.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.score != null && (
                        <span className="text-blue-400 text-sm tabular-nums">{p.score}</span>
                      )}
                      <span className="text-blue-500 text-sm">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {session.notes && (
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-2">
                Notes
              </p>
              <p className="text-blue-200 text-sm leading-relaxed">{session.notes}</p>
            </div>
          )}

        </div>
      )}
    </PageLayout>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-blue-400">{label}</span>
      {children}
    </div>
  )
}
