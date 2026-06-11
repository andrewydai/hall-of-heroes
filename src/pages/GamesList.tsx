import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { resolveGameImage } from '../lib/avatar'

export default function GamesList() {
  const { data: games, loading, error } = useApi(() => api.games.list(), 'games-list')

  return (
    <PageLayout>
      <h1 className="font-jacquard text-tavern-gold mb-6" style={{ fontSize: '2.2rem' }}>Games</h1>

      {loading && <LoadingSpinner message="Pulling up the records…" />}
      {error && <ErrorMessage message={error} />}

      {games && games.length === 0 && (
        <p className="text-blue-400 text-sm italic text-center py-12">
          No games have been added yet.
        </p>
      )}

      {games && games.length > 0 && (
        <div className="flex flex-col gap-2">
          {games.map(game => (
            <Link
              key={game.id}
              to={`/games/${game.id}`}
              className="flex items-center gap-3 bg-[#060a23]/80 border border-blue-900/60 rounded-lg px-3 py-3 hover:border-blue-700 transition-colors group"
            >
              <div className="w-10 h-10 shrink-0 border border-blue-800 rounded-lg overflow-hidden">
                <img
                  src={resolveGameImage(game.icon_path)}
                  alt=""
                  className="w-full h-full object-cover object-top"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-blue-100 text-sm group-hover:text-tavern-gold transition-colors">
                  {game.name}
                </span>
                <p className="text-blue-500 text-xs mt-0.5 capitalize">{game.type}</p>
              </div>
              <span className="text-blue-500 text-sm shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
