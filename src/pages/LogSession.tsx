import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import PasscodeGate from '../components/PasscodeGate'
import PageLayout from '../components/PageLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { resolveAvatar, resolveGameImage } from '../lib/avatar'
import type { CoopResult, CreateSessionPayload, Game, Player } from '../types'

const TILE_BG = 'rgba(6, 10, 35, 0.8)'

const inputClass = [
  'w-full border border-blue-900 rounded px-3 py-2.5',
  'text-blue-100 placeholder-blue-800 text-sm',
  'focus:outline-none focus:border-tavern-gold transition-colors',
].join(' ')

const labelClass = 'block text-blue-400 text-xs uppercase tracking-wider mb-1.5'

type Tab = 'competitive' | 'cooperative'

// ---------------------------------------------------------------------------
// Shared chevron
// ---------------------------------------------------------------------------

function Chevron({ open, color = '#4a7aad' }: { open: boolean; color?: string }) {
  return (
    <svg
      width="10" height="6" viewBox="0 0 10 6" fill="none"
      className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M1 1l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// GameSelect — single-select dropdown with game icons
// ---------------------------------------------------------------------------

function GameSelect({
  games,
  value,
  onChange,
  placeholder,
}: {
  games: Game[]
  value: string
  onChange: (id: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const selected = games.find(g => g.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-blue-900 rounded px-3 py-2.5 text-sm text-left flex items-center justify-between gap-2 transition-colors hover:border-blue-700 focus:outline-none"
        style={{ background: TILE_BG }}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <img
              src={resolveGameImage(selected.icon_path)}
              alt=""
              className="w-6 h-6 shrink-0 rounded object-cover object-top"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-blue-100 truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-blue-700">{placeholder}</span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div
          className="absolute z-20 w-full mt-1 border border-blue-900 rounded overflow-y-auto"
          style={{ background: TILE_BG, maxHeight: '220px' }}
        >
          {games.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => { onChange(g.id); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-blue-900/20 transition-colors ${
                g.id === value ? 'text-tavern-gold' : 'text-blue-100'
              }`}
            >
              <img
                src={resolveGameImage(g.icon_path)}
                alt=""
                className="w-7 h-7 shrink-0 rounded object-cover object-top border border-blue-800"
                style={{ imageRendering: 'pixelated' }}
              />
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MultiSelect — multi-select dropdown with player avatars
// ---------------------------------------------------------------------------

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  variant = 'default',
  disabled = false,
}: {
  options: Player[]
  selected: string[]
  onChange: (ids: string[]) => void
  placeholder: string
  variant?: 'default' | 'gold'
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id])
  }

  const isGold = variant === 'gold'
  const borderIdle = isGold ? 'border-tavern-gold/50' : 'border-blue-900'
  const borderOpen = isGold ? 'border-tavern-gold'    : 'border-blue-700'
  const accentColor = isGold ? '#d4af37' : '#c98a28'
  const textColor   = isGold ? 'text-tavern-gold'     : 'text-blue-100'

  const selectedPlayers = options.filter(o => selected.includes(o.id))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full border ${open ? borderOpen : borderIdle} rounded px-3 py-2.5 text-sm text-left flex items-center justify-between gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
        style={{ background: TILE_BG }}
      >
        {/* Trigger label — avatars always visible, names truncate when tight */}
        {selected.length === 0 ? (
          <span className="text-blue-700">{placeholder}</span>
        ) : (
          <span className="flex items-center gap-2 min-w-0">
            {/* Stacked avatars — always shrink-0 so they never disappear */}
            <span className="flex -space-x-1.5 shrink-0">
              {selectedPlayers.slice(0, 4).map(p => (
                <img
                  key={p.id}
                  src={resolveAvatar(p.avatar_url)}
                  alt=""
                  className="w-6 h-6 rounded border-2 object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    borderColor: isGold ? '#d4af37' : '#1e3a5f',
                    background: TILE_BG,
                  }}
                />
              ))}
            </span>
            {/* Names — truncate on overflow so avatars always show */}
            <span className={`truncate min-w-0 ${textColor}`}>
              {selectedPlayers.map(p => p.display_name ?? p.name).join(', ')}
            </span>
          </span>
        )}
        <Chevron open={open} color={isGold ? '#d4af37' : '#4a7aad'} />
      </button>

      {open && (
        <div
          className={`absolute z-20 w-full mt-1 border ${borderIdle} rounded overflow-y-auto`}
          style={{ background: TILE_BG, maxHeight: '220px' }}
        >
          {options.length === 0 && (
            <p className="px-3 py-3 text-blue-600 text-sm italic">No players available.</p>
          )}
          {options.map(o => {
            const isChecked = selected.includes(o.id)
            return (
              <label
                key={o.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-900/20 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(o.id)}
                  className="w-4 h-4 shrink-0"
                  style={{ accentColor }}
                />
                <img
                  src={resolveAvatar(o.avatar_url)}
                  alt=""
                  className="w-7 h-7 shrink-0 rounded object-contain border border-blue-800"
                  style={{ imageRendering: 'pixelated', background: TILE_BG }}
                />
                <span className={`text-sm ${isGold ? 'text-tavern-gold' : 'text-blue-100'}`}>
                  {o.display_name ?? o.name}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function LogSessionForm() {
  const navigate = useNavigate()

  const { data: games, loading: gamesLoading } = useApi(() => api.games.list(), 'games')
  const { data: players, loading: playersLoading } = useApi(() => api.players.list(), 'players')

  const [tab, setTab] = useState<Tab>('competitive')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

  // competitive
  const [compGameId,    setCompGameId]    = useState('')
  const [compPlayerIds, setCompPlayerIds] = useState<string[]>([])
  const [compWinnerIds, setCompWinnerIds] = useState<string[]>([])

  // cooperative
  const [coopGameId,    setCoopGameId]    = useState('')
  const [coopPlayerIds, setCoopPlayerIds] = useState<string[]>([])
  const [coopResult,    setCoopResult]    = useState<CoopResult | ''>('')

  // shared
  const [quote, setQuote] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function switchTab(t: Tab) {
    setTab(t)
    setCompGameId(''); setCompPlayerIds([]); setCompWinnerIds([])
    setCoopGameId(''); setCoopPlayerIds([]); setCoopResult('')
    setQuote(''); setNotes('')
    setSubmitError(null)
  }

  function handleCompPlayerChange(ids: string[]) {
    setCompPlayerIds(ids)
    setCompWinnerIds(prev => prev.filter(id => ids.includes(id)))
  }

  const competitiveGames = games?.filter(g => g.type === 'competitive') ?? []
  const cooperativeGames = games?.filter(g => g.type === 'cooperative') ?? []
  const eligibleWinners  = (players ?? []).filter(p => compPlayerIds.includes(p.id))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (tab === 'competitive') {
      if (!compGameId)                return setSubmitError('Select a game.')
      if (compPlayerIds.length === 0) return setSubmitError('Select at least one player.')
      if (compWinnerIds.length === 0) return setSubmitError('Select at least one winner.')
    } else {
      if (!coopGameId)                return setSubmitError('Select a game.')
      if (coopPlayerIds.length === 0) return setSubmitError('Select at least one player.')
      if (!coopResult)                return setSubmitError('Select a co-op result.')
    }

    const payload: CreateSessionPayload =
      tab === 'competitive'
        ? {
            game_id:     compGameId,
            date,
            quote:       quote.trim() || null,
            coop_result: null,
            notes:       notes.trim() || null,
            players:     compPlayerIds.map(id => ({
              player_id: id,
              score:     null,
              is_winner: compWinnerIds.includes(id),
            })),
          }
        : {
            game_id:     coopGameId,
            date,
            quote:       quote.trim() || null,
            coop_result: coopResult as CoopResult,
            notes:       notes.trim() || null,
            players:     coopPlayerIds.map(id => ({
              player_id: id,
              score:     null,
              is_winner: false,
            })),
          }

    setSubmitting(true)
    try {
      const { id } = await api.sessions.create(payload)
      navigate(`/sessions/${id}`)
    } catch (err) {
      setSubmitError((err as Error).message ?? 'Failed to save session.')
      setSubmitting(false)
    }
  }

  if (gamesLoading || playersLoading) return <LoadingSpinner message="Loading…" />
  if (!games || !players) return <ErrorMessage message="Could not load games or players." />

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      type="button"
      onClick={() => switchTab(t)}
      className={`flex-1 py-2.5 text-sm transition-colors border-b-2 ${
        tab === t
          ? 'border-tavern-gold text-tavern-gold'
          : 'border-transparent text-blue-500 hover:text-blue-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-8">

      {/* Date */}
      <div>
        <label className={labelClass}>Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className={inputClass}
          style={{ background: TILE_BG }}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-blue-900/60 -mb-2">
        {tabBtn('competitive', 'Competitive')}
        {tabBtn('cooperative', 'Co-op')}
      </div>

      {/* ── Competitive panel ── */}
      {tab === 'competitive' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Game</label>
            <GameSelect
              games={competitiveGames}
              value={compGameId}
              onChange={setCompGameId}
              placeholder="Select a game…"
            />
          </div>

          <div>
            <label className={labelClass}>Players</label>
            <MultiSelect
              options={players}
              selected={compPlayerIds}
              onChange={handleCompPlayerChange}
              placeholder="Select players…"
            />
          </div>

          <div>
            <label className={labelClass}>
              Winners{' '}
              <span className="normal-case text-blue-600">— select all for a tie</span>
            </label>
            <MultiSelect
              options={eligibleWinners}
              selected={compWinnerIds}
              onChange={setCompWinnerIds}
              placeholder="Select winner(s)…"
              variant="gold"
              disabled={compPlayerIds.length === 0}
            />
          </div>
        </div>
      )}

      {/* ── Co-op panel ── */}
      {tab === 'cooperative' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Game</label>
            <GameSelect
              games={cooperativeGames}
              value={coopGameId}
              onChange={setCoopGameId}
              placeholder="Select a game…"
            />
          </div>

          <div>
            <label className={labelClass}>Players</label>
            <MultiSelect
              options={players}
              selected={coopPlayerIds}
              onChange={setCoopPlayerIds}
              placeholder="Select players…"
            />
          </div>

          <div>
            <label className={labelClass}>Result</label>
            <div className="flex gap-6 flex-wrap pt-0.5">
              {([
                { value: 'win',         label: 'Victory',     color: 'text-blue-300' },
                { value: 'loss',        label: 'Defeat',      color: 'text-red-400'  },
                { value: 'in_progress', label: 'In Progress', color: 'text-blue-500' },
              ] as const).map(({ value, label, color }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="coop_result"
                    value={value}
                    checked={coopResult === value}
                    onChange={() => setCoopResult(value)}
                    className="w-4 h-4"
                    style={{ accentColor: '#c98a28' }}
                  />
                  <span className={`text-sm ${color}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quote */}
      <div>
        <label className={labelClass}>
          Quote <span className="normal-case text-blue-600">(optional)</span>
        </label>
        <textarea
          value={quote}
          onChange={e => setQuote(e.target.value)}
          placeholder="What will be remembered from this session?"
          rows={3}
          className={`${inputClass} resize-none`}
          style={{ background: TILE_BG }}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>
          Notes <span className="normal-case text-blue-600">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything else worth remembering…"
          rows={2}
          className={`${inputClass} resize-none`}
          style={{ background: TILE_BG }}
        />
      </div>

      {submitError && (
        <p className="text-red-400 text-sm text-center -mb-2">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full border border-tavern-gold/60 text-tavern-gold rounded py-3 hover:bg-tavern-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: TILE_BG, fontFamily: "'Pixelify Sans', sans-serif", fontSize: '13px' }}
      >
        {submitting ? 'Saving…' : 'Record the Session'}
      </button>

    </form>
  )
}

export default function LogSession() {
  return (
    <PasscodeGate>
      <PageLayout>
        <h1 className="font-jacquard text-tavern-gold mb-6" style={{ fontSize: '2.2rem' }}>
          Log a Session
        </h1>
        <LogSessionForm />
      </PageLayout>
    </PasscodeGate>
  )
}
