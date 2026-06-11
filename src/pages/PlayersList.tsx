import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { resolveAvatar } from '../lib/avatar'

type SortMode = 'alpha' | 'total_wins' | 'game_wins'

export default function PlayersList() {
  const { data: players, loading, error } = useApi(() => api.players.leaderboard(), 'players-leaderboard')

  const [sortMode, setSortMode] = useState<SortMode>('alpha')
  const [selectedGame, setSelectedGame] = useState<string>('')

  // Unique competitive games that have at least one win recorded
  const gamesWithWins = useMemo(() => {
    if (!players) return []
    const seen = new Map<string, string>() // game_id → game_name
    for (const p of players) {
      for (const gw of p.game_wins) {
        if (!seen.has(gw.game_id)) seen.set(gw.game_id, gw.game_name)
      }
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [players])

  function handleSortMode(mode: SortMode) {
    setSortMode(mode)
    if (mode !== 'game_wins') setSelectedGame('')
  }

  const sorted = useMemo(() => {
    if (!players) return []
    const copy = [...players]

    if (sortMode === 'alpha') {
      return copy.sort((a, b) =>
        (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name)
      )
    }

    if (sortMode === 'total_wins') {
      return copy.sort((a, b) =>
        b.total_wins - a.total_wins ||
        (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name)
      )
    }

    // game_wins — sort by wins in the selected game, 0 if no wins
    return copy.sort((a, b) => {
      const aWins = a.game_wins.find(gw => gw.game_id === selectedGame)?.wins ?? 0
      const bWins = b.game_wins.find(gw => gw.game_id === selectedGame)?.wins ?? 0
      return bWins - aWins ||
        (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name)
    })
  }, [players, sortMode, selectedGame])

  // Win count to show next to each player given current sort
  function winLabel(p: typeof sorted[number]): string | null {
    if (sortMode === 'total_wins') return `${p.total_wins}W`
    if (sortMode === 'game_wins' && selectedGame) {
      const wins = p.game_wins.find(gw => gw.game_id === selectedGame)?.wins ?? 0
      return `${wins}W`
    }
    return null
  }

  return (
    <PageLayout>
      <h1 className="font-jacquard text-tavern-gold mb-4" style={{ fontSize: '2.2rem' }}>Players</h1>

      {/* Sort controls — all on one row so the game selector expands right with no vertical shift */}
      {players && players.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {([['alpha', 'A–Z'], ['total_wins', 'Total Wins'], ['game_wins', 'By Game']] as [SortMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => handleSortMode(mode)}
              className={`text-xs border rounded px-2 py-1 transition-colors shrink-0 ${
                sortMode === mode
                  ? 'border-tavern-gold text-tavern-gold bg-tavern-gold/10'
                  : 'border-blue-900 text-blue-400 hover:border-blue-700'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Fills remaining row space after the pills */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              maxWidth: sortMode === 'game_wins' ? '400px' : '0px',
              opacity: sortMode === 'game_wins' ? 1 : 0,
              pointerEvents: sortMode === 'game_wins' ? 'auto' : 'none',
              transition: 'max-width 0.25s ease, opacity 0.15s ease',
            }}
          >
            <select
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)}
              className="w-full border border-blue-900 text-blue-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-tavern-gold transition-colors"
              style={{
                background: '#030614',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <option value="">Select a game…</option>
              {gamesWithWins.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner message="Summoning the heroes…" />}
      {error && <ErrorMessage message={error} />}

      {players && players.length === 0 && (
        <p className="text-blue-400 text-sm italic text-center py-12">
          No players have been added yet.
        </p>
      )}

      {players && players.length > 0 && (
        <div className="flex flex-col gap-2">
          {sorted.map(player => {
            const label = winLabel(player)
            return (
              <Link
                key={player.id}
                to={`/players/${player.id}`}
                className="flex items-center gap-3 bg-[#060a23]/80 border border-blue-900/60 rounded-lg px-3 py-3 hover:border-blue-700 transition-colors group"
              >
                <div className="w-10 h-10 shrink-0 border border-blue-800 rounded-lg overflow-hidden">
                  <img
                    src={resolveAvatar(player.avatar_url)}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <span className="text-blue-100 text-sm flex-1 group-hover:text-tavern-gold transition-colors">
                  {player.display_name ?? player.name}
                </span>
                {label && (
                  <span className="text-tavern-gold text-xs tabular-nums shrink-0">{label}</span>
                )}
                <span className="text-blue-500 text-sm shrink-0">→</span>
              </Link>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
