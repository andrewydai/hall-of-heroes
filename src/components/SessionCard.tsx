import { Link } from 'react-router-dom'
import type { SessionSummary } from '../types'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function SessionCard({ session }: { session: SessionSummary }) {
  const outcome = session.victor_names
    ? `${session.victor_names.split(',').join(' & ')} won`
    : session.coop_result === 'win'         ? 'Co-op victory'
    : session.coop_result === 'loss'        ? 'Co-op defeat'
    : session.coop_result === 'in_progress' ? 'In progress'
    : null

  return (
    <Link to={`/sessions/${session.id}`} className="block group">
      <div className="bg-[#060a23]/80 border border-blue-900/60 rounded-lg p-4 group-hover:border-blue-700 transition-colors overflow-hidden">
        {session.quote && (
          <p className="text-blue-100 text-sm italic mb-3 leading-relaxed line-clamp-2 break-words">
            "{session.quote}"
          </p>
        )}
        <div className="flex items-center justify-between gap-2 text-blue-400 text-xs">
          <span className="truncate">{session.game_name}</span>
          <div className="flex items-center gap-2 shrink-0">
            {outcome && <span>{outcome}</span>}
            <span>{formatDate(session.date)}</span>
            <span className="text-blue-500">→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
