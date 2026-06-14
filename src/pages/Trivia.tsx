import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { resolveAvatar } from '../lib/avatar'
import type { Player, TriviaToday, TriviaResult, TriviaLeaderboardEntry, TriviaStatus } from '../types'

// ── Color config per question column ────────────────────────────────────────

const Q = {
  q1: {
    staticLabel:  'GAME',
    header:       '#93c5fd',
    borderIdle:   'rgba(30,64,175,0.6)',
    borderActive: '#60a5fa',
    bgIdle:       'rgba(59,130,246,0.08)',
    bgActive:     'rgba(59,130,246,0.22)',
    bar:          '#3b82f6',
  },
  q2: {
    staticLabel:  'VICTOR',
    header:       '#d4af37',
    borderIdle:   'rgba(120,96,10,0.7)',
    borderActive: '#d4af37',
    bgIdle:       'rgba(212,175,55,0.08)',
    bgActive:     'rgba(212,175,55,0.20)',
    bar:          '#eab308',
  },
  q3: {
    staticLabel:  'DATE',
    header:       '#c4b5fd',
    borderIdle:   'rgba(76,29,149,0.7)',
    borderActive: '#8b5cf6',
    bgIdle:       'rgba(139,92,246,0.08)',
    bgActive:     'rgba(139,92,246,0.22)',
    bar:          '#8b5cf6',
  },
} as const

type QKey = keyof typeof Q

// ── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ q1, q2, q3 }: { q1: boolean; q2: boolean; q3: boolean }) {
  return (
    <div className="flex h-4 gap-0.5 rounded overflow-hidden">
      <div className="flex-1" style={{ background: q1 ? Q.q1.bar : 'rgba(30,58,138,0.2)' }} />
      <div className="flex-1" style={{ background: q2 ? Q.q2.bar : 'rgba(30,58,138,0.2)' }} />
      <div className="flex-1" style={{ background: q3 ? Q.q3.bar : 'rgba(30,58,138,0.2)' }} />
    </div>
  )
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

function TriviaLeaderboard({
  entries,
  myPlayerId,
  gameType,
}: {
  entries: TriviaLeaderboardEntry[]
  myPlayerId: string
  gameType: string
}) {
  if (entries.length === 0) {
    return <p className="text-blue-500 text-sm italic text-center py-4">No scores yet.</p>
  }

  const q2Label = gameType === 'cooperative' ? 'RESULT' : 'VICTOR'

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex gap-0.5 px-4">
        {(['q1', 'q2', 'q3'] as QKey[]).map(k => (
          <div key={k} className="flex-1 text-center" style={{ fontSize: '9px', color: Q[k].header }}>
            {k === 'q2' ? q2Label : Q[k].staticLabel}
          </div>
        ))}
      </div>

      {entries.map(e => {
        const isMe = e.player_id === myPlayerId
        return (
          <div
            key={e.player_id}
            className={`rounded-lg px-4 py-3 border ${isMe ? 'border-tavern-gold/50' : 'border-blue-900/60'}`}
            style={{ background: 'rgba(6,10,35,0.8)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src={resolveAvatar(e.avatar_url)}
                alt=""
                className="w-6 h-6 rounded object-contain border border-blue-900 shrink-0"
                style={{ imageRendering: 'pixelated', background: 'rgba(6,10,35,0.8)' }}
              />
              <span className={`text-sm flex-1 truncate ${isMe ? 'text-tavern-gold' : 'text-blue-100'}`}>
                {e.display_name ?? e.name}
                {isMe && <span className="text-xs text-blue-600 ml-1.5">(you)</span>}
              </span>
              <span className={`text-sm font-semibold tabular-nums shrink-0 ${isMe ? 'text-tavern-gold' : 'text-blue-300'}`}>
                {e.score}/3
              </span>
            </div>
            <ScoreBar q1={e.q1_correct === 1} q2={e.q2_correct === 1} q3={e.q3_correct === 1} />
          </div>
        )
      })}
    </div>
  )
}

// ── Answer cell ───────────────────────────────────────────────────────────────

function AnswerCell({
  label,
  value,
  qKey,
  selectedValue,
  revealed,
  correctValue,
  onSelect,
}: {
  label: string
  value: string
  qKey: QKey
  selectedValue: string | null
  revealed: boolean
  correctValue: string | null
  onSelect: () => void
}) {
  const isSelected = value === selectedValue
  const isCorrect  = correctValue !== null && value === correctValue
  const col = Q[qKey]

  const baseClass = 'w-full text-xs px-2 py-3 rounded border text-left leading-snug break-words'

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`${baseClass} transition-colors`}
        style={{
          background:  isSelected ? col.bgActive  : col.bgIdle,
          borderColor: isSelected ? col.borderActive : col.borderIdle,
          color:       isSelected ? col.header    : 'rgba(96,130,163,0.9)',
        }}
      >
        {label}
      </button>
    )
  }

  // Post-submit reveal
  if (isSelected && isCorrect)
    return <div className={baseClass} style={{ background: 'rgba(34,197,94,0.15)', borderColor: '#22c55e', color: '#86efac' }}>✓ {label}</div>
  if (isSelected && !isCorrect)
    return <div className={baseClass} style={{ background: 'rgba(239,68,68,0.15)', borderColor: '#ef4444', color: '#fca5a5' }}>✗ {label}</div>
  if (!isSelected && isCorrect)
    return <div className={baseClass} style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.4)', color: '#4ade80' }}>✓ {label}</div>
  return <div className={baseClass} style={{ borderColor: 'rgba(30,58,138,0.2)', color: 'rgba(30,58,138,0.45)' }}>{label}</div>
}

// ── Trivia grid ───────────────────────────────────────────────────────────────

function TriviaGrid({
  trivia,
  q1, q2, q3,
  setQ1, setQ2, setQ3,
  revealed,
  correctValues,
}: {
  trivia: TriviaToday
  q1: string | null; q2: string | null; q3: string | null
  setQ1: (v: string) => void; setQ2: (v: string) => void; setQ3: (v: string) => void
  revealed: boolean
  correctValues: { q1: string; q2: string; q3: string } | null
}) {
  const q2Label = trivia.game_type === 'cooperative' ? 'RESULT' : 'VICTOR'

  const columns = [
    { key: 'q1' as QKey, choices: trivia.q1_choices, selected: q1, set: setQ1 },
    { key: 'q2' as QKey, choices: trivia.q2_choices, selected: q2, set: setQ2 },
    { key: 'q3' as QKey, choices: trivia.q3_choices, selected: q3, set: setQ3 },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Column headers */}
      {columns.map(({ key }) => (
        <div
          key={key}
          className="text-center font-semibold tracking-wider pb-1.5 border-b"
          style={{ color: Q[key].header, borderColor: Q[key].borderIdle, fontSize: '10px' }}
        >
          {key === 'q2' ? q2Label : Q[key].staticLabel}
        </div>
      ))}

      {/* 3 rows of choices (flatMap keeps grid children flat) */}
      {[0, 1, 2].flatMap(row =>
        columns.map(({ key, choices, selected, set }) => (
          <AnswerCell
            key={`${key}-${row}`}
            label={choices[row]?.label ?? '—'}
            value={choices[row]?.value ?? ''}
            qKey={key}
            selectedValue={selected}
            revealed={revealed}
            correctValue={correctValues ? correctValues[key] : null}
            onSelect={() => set(choices[row]?.value ?? '')}
          />
        ))
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Phase = 'select' | 'playing' | 'done' | 'already_played'

export default function TriviaPage() {
  const { data: trivia, loading: triviaLoading } = useApi(() => api.trivia.today(), 'trivia-today')
  const { data: players, loading: playersLoading } = useApi(() => api.players.list(), 'players')

  const [phase,      setPhase]      = useState<Phase>('select')
  const [me,         setMe]         = useState<Player | null>(null)
  const [checking,   setChecking]   = useState(false)

  const [q1, setQ1] = useState<string | null>(null)
  const [q2, setQ2] = useState<string | null>(null)
  const [q3, setQ3] = useState<string | null>(null)

  const [submitting,  setSubmitting]  = useState(false)
  const [result,      setResult]      = useState<TriviaResult | null>(null)
  const [prevStatus,  setPrevStatus]  = useState<TriviaStatus | null>(null)
  const [leaderboard, setLeaderboard] = useState<TriviaLeaderboardEntry[] | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  async function handlePlayerSelect(player: Player) {
    setChecking(true)
    setError(null)
    try {
      const status = await api.trivia.status(player.id)
      setMe(player)
      if (status.played) {
        setPrevStatus(status)
        const lb = await api.trivia.leaderboard()
        setLeaderboard(lb)
        setPhase('already_played')
      } else {
        setPhase('playing')
      }
    } catch {
      setError('Could not check status. Try again.')
    } finally {
      setChecking(false)
    }
  }

  async function handleSubmit() {
    if (!q1 || !q2 || !q3 || !me) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.trivia.submit({ player_id: me.id, q1, q2, q3 })
      setResult(res)
      const lb = await api.trivia.leaderboard()
      setLeaderboard(lb)
      setPhase('done')
    } catch (err) {
      setError((err as Error).message ?? 'Failed to submit.')
      setSubmitting(false)
    }
  }

  if (triviaLoading || playersLoading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading today's trivia…" />
      </PageLayout>
    )
  }

  if (!trivia || !players) {
    return (
      <PageLayout>
        <p className="text-red-400 text-sm text-center py-8">No trivia available today.</p>
      </PageLayout>
    )
  }

  const allAnswered = q1 !== null && q2 !== null && q3 !== null

  const isRevealed = phase === 'done' || phase === 'already_played'
  const correctValues = phase === 'done'
    ? (result?.correct ?? null)
    : (prevStatus?.correct ?? null)

  return (
    <PageLayout>
      <h1 className="font-jacquard text-tavern-gold mb-1" style={{ fontSize: '2.2rem' }}>Trivia</h1>
      <p className="text-blue-500 text-xs mb-6">{trivia.date}</p>

      <div className="flex flex-col gap-6">

        {/* ── Quote — always visible ── */}
        <div
          className="rounded-lg border border-blue-900/60 p-4"
          style={{ background: 'rgba(6,10,35,0.8)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-500 text-xs uppercase tracking-widest">Today's Quote</span>
            {trivia.game_type === 'cooperative' && (
              <span
                className="text-xs border rounded px-2 py-0.5"
                style={{ borderColor: Q.q2.borderIdle, color: Q.q2.header }}
              >
                Co-op
              </span>
            )}
          </div>
          <p className="text-blue-100 text-sm italic leading-relaxed break-words">
            "{trivia.quote}"
          </p>
        </div>

        {/* ── 3×3 grid — always visible ── */}
        <TriviaGrid
          trivia={trivia}
          q1={q1} q2={q2} q3={q3}
          setQ1={setQ1} setQ2={setQ2} setQ3={setQ3}
          revealed={isRevealed}
          correctValues={correctValues}
        />

        {/* ── Player select ── */}
        {phase === 'select' && (
          <div className="flex flex-col gap-4">
            <p className="text-blue-300 text-sm">Who are you?</p>
            <div className="flex flex-col gap-2">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePlayerSelect(p)}
                  disabled={checking}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 border border-blue-900/60 hover:border-blue-700 transition-colors text-left disabled:opacity-50"
                  style={{ background: 'rgba(6,10,35,0.8)' }}
                >
                  <img
                    src={resolveAvatar(p.avatar_url)}
                    alt=""
                    className="w-8 h-8 rounded object-contain border border-blue-800 shrink-0"
                    style={{ imageRendering: 'pixelated', background: 'rgba(6,10,35,0.8)' }}
                  />
                  <span className="text-blue-100 text-sm">{p.display_name ?? p.name}</span>
                </button>
              ))}
            </div>
            {checking && <LoadingSpinner message="Checking…" />}
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          </div>
        )}

        {/* ── Submit ── */}
        {phase === 'playing' && (
          <>
            {error && <p className="text-red-400 text-sm text-center -mb-2">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="w-full border border-tavern-gold/60 text-tavern-gold rounded py-3 hover:bg-tavern-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(6,10,35,0.8)', fontFamily: "'Pixelify Sans', sans-serif", fontSize: '13px' }}
            >
              {submitting ? 'Submitting…' : allAnswered ? 'Submit Answers' : 'Answer All 3 Questions'}
            </button>
          </>
        )}

        {/* ── Score summary + leaderboard (done) ── */}
        {phase === 'done' && result && me && (
          <div className="flex flex-col gap-6">
            <div
              className="rounded-lg border border-tavern-gold/40 px-4 py-5 text-center"
              style={{ background: 'rgba(6,10,35,0.8)' }}
            >
              <p className="text-blue-400 text-xs uppercase tracking-widest mb-1">Your Score</p>
              <p className="font-jacquard text-tavern-gold" style={{ fontSize: '2.5rem' }}>
                {result.score}/3
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">Today's Leaderboard</p>
              <TriviaLeaderboard entries={leaderboard ?? []} myPlayerId={me.id} gameType={trivia.game_type} />
            </div>
          </div>
        )}

        {/* ── Already played summary + leaderboard ── */}
        {phase === 'already_played' && me && prevStatus && (
          <div className="flex flex-col gap-6">
            <div
              className="rounded-lg border border-tavern-gold/40 px-4 py-5 text-center"
              style={{ background: 'rgba(6,10,35,0.8)' }}
            >
              <p className="text-blue-400 text-xs uppercase tracking-widest mb-1">You already played today</p>
              <p className="font-jacquard text-tavern-gold mb-3" style={{ fontSize: '2.5rem' }}>
                {prevStatus.score}/3
              </p>
              <div className="px-2">
                <ScoreBar
                  q1={prevStatus.q1_correct === 1}
                  q2={prevStatus.q2_correct === 1}
                  q3={prevStatus.q3_correct === 1}
                />
                <div className="flex gap-0.5 mt-1">
                  {(['q1','q2','q3'] as QKey[]).map(k => (
                    <div key={k} className="flex-1 text-center" style={{ fontSize: '9px', color: Q[k].header }}>
                      {k === 'q2' && trivia.game_type === 'cooperative' ? 'RESULT' : Q[k].staticLabel}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">Today's Leaderboard</p>
              {leaderboard && (
                <TriviaLeaderboard entries={leaderboard} myPlayerId={me.id} gameType={trivia.game_type} />
              )}
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  )
}
