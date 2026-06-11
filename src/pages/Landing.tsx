import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import DrawerNav from '../components/DrawerNav'
import type { SessionSummary } from '../types'

// ---------------------------------------------------------------------------
// Star field — pre-computed, stable across re-renders
// ---------------------------------------------------------------------------
const STARS = [
  { x:  5, y:  8, size: 1.5, dur: 2.8, delay: 0.3 },
  { x: 12, y: 22, size: 1,   dur: 3.5, delay: 1.1 },
  { x: 19, y:  5, size: 2,   dur: 2.2, delay: 0.7 },
  { x: 27, y: 35, size: 1,   dur: 4.1, delay: 2.0 },
  { x: 33, y: 14, size: 1.5, dur: 3.0, delay: 0.5 },
  { x: 40, y: 28, size: 1,   dur: 2.6, delay: 1.8 },
  { x: 48, y:  9, size: 2,   dur: 3.8, delay: 0.2 },
  { x: 55, y: 41, size: 1,   dur: 2.4, delay: 2.5 },
  { x: 61, y: 17, size: 1.5, dur: 3.3, delay: 0.9 },
  { x: 68, y:  3, size: 1,   dur: 2.9, delay: 1.4 },
  { x: 75, y: 30, size: 2,   dur: 4.4, delay: 0.6 },
  { x: 82, y: 12, size: 1,   dur: 3.1, delay: 1.7 },
  { x: 88, y: 24, size: 1.5, dur: 2.7, delay: 0.4 },
  { x: 93, y:  7, size: 1,   dur: 3.6, delay: 2.2 },
  { x: 97, y: 38, size: 2,   dur: 2.3, delay: 1.0 },
  { x:  8, y: 45, size: 1,   dur: 4.0, delay: 0.8 },
  { x: 22, y: 52, size: 1.5, dur: 2.5, delay: 1.5 },
  { x: 36, y: 18, size: 1,   dur: 3.7, delay: 0.1 },
  { x: 52, y: 55, size: 1,   dur: 2.1, delay: 2.8 },
  { x: 71, y: 48, size: 1.5, dur: 3.4, delay: 0.3 },
  { x: 85, y: 56, size: 1,   dur: 2.8, delay: 1.9 },
  { x: 44, y: 62, size: 2,   dur: 3.2, delay: 0.7 },
  { x: 15, y: 68, size: 1,   dur: 4.2, delay: 1.2 },
  { x: 60, y: 70, size: 1.5, dur: 2.6, delay: 2.3 },
  { x: 79, y: 65, size: 1,   dur: 3.9, delay: 0.5 },
]

// 4 quote slots arranged in a 2×2 grid flanking the center title block.
// Left column at ~10%, right at ~56% — neither hugs the screen edge nor
// bleeds into the center. Max-width ~120px keeps each card in its column.
// Top row sits above the title, bottom row below it.
// Delays stagger initial appearance: top-left → bottom-right → bottom-left → top-right
const QUOTE_SLOTS = [
  { x: 10, y:  6, dur: 14, delay: 0.3 },   // upper-left   (1st)
  { x: 57, y:  9, dur: 16, delay: 3.3 },   // upper-right  (4th)
  { x: 10, y: 55, dur: 13, delay: 2.3 },   // lower-left   (3rd)
  { x: 57, y: 58, dur: 15, delay: 1.3 },   // lower-right  (2nd)
]

// ---------------------------------------------------------------------------
// Quote card — drifts, links to session detail
// ---------------------------------------------------------------------------
function QuoteCard({ session, x, y, dur, delay, onCycle }: {
  session: SessionSummary
  x: number; y: number; dur: number; delay: number
  onCycle: () => void
}) {
  if (!session.quote) return null

  const winner = session.victor_names
    ? session.victor_names.split(',').join(' & ')
    : null

  const attribution = winner
    ? `${winner} · ${session.game_name}`
    : session.game_name

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="absolute text-center pointer-events-auto"
      style={{
        left:      `${x}%`,
        top:       `${y}%`,
        width:     '120px',
        animation: `drift ${dur}s ease-in-out ${delay}s infinite backwards`,
      }}
      onAnimationIteration={onCycle}
    >
      <p
        className="text-blue-200 whitespace-pre-line"
        style={{ fontFamily: "'Pixelify Sans', sans-serif", fontSize: '11px', lineHeight: 1.4, margin: 0, textShadow: '0 0 6px rgba(150,180,255,0.7)' }}
      >
        "{session.quote}"
      </p>
      <span
        className="text-blue-400"
        style={{ fontFamily: "'Pixelify Sans', sans-serif", fontSize: '10px', lineHeight: 1.6, display: 'block', marginTop: '3px' }}
      >
        — {attribution}
      </span>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------
export default function Landing() {
  const { data: sessions, loading } = useApi(() => api.sessions.list(30), 'sessions-landing')

  const [slotSessions, setSlotSessions] = useState<(SessionSummary | null)[]>([null, null, null, null])

  // Populate slots once sessions load
  useEffect(() => {
    if (!sessions) return
    const pool = sessions.filter(s => s.quote && s.quote.length <= 60)
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    setSlotSessions([shuffled[0] ?? null, shuffled[1] ?? null, shuffled[2] ?? null, shuffled[3] ?? null])
  }, [sessions])

  // Called when a slot's drift animation completes one cycle (card is transparent at that moment)
  const cycleSlot = useCallback((slotIndex: number) => {
    if (!sessions) return
    const pool = sessions.filter(s => s.quote && s.quote.length <= 60)
    setSlotSessions(prev => {
      const otherIds = new Set(prev.filter((_, i) => i !== slotIndex).map(s => s?.id))
      const candidates = pool.filter(s => !otherIds.has(s.id))
      if (candidates.length === 0) return prev
      const next = candidates[Math.floor(Math.random() * candidates.length)]
      const updated = [...prev]
      updated[slotIndex] = next
      return updated
    })
  }, [sessions])

  return (
    <div
      className="min-h-dvh flex flex-col select-none overflow-hidden relative"
      style={{ background: '#060a23' }}
    >
      {/* Hamburger */}
      <div className="absolute top-4 right-4 z-50">
        <DrawerNav />
      </div>

      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left:      `${star.x}%`,
              top:       `${star.y}%`,
              width:     `${star.size}px`,
              height:    `${star.size}px`,
              animation: `twinkle ${star.dur}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Moonlight glow */}
      <div
        className="absolute inset-x-0 top-0 h-64 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(100,130,220,0.12), transparent)',
        }}
      />

      {/* Drifting quote cards */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {!loading && slotSessions.map((session, i) =>
          session ? (
            <QuoteCard
              key={i}
              session={session}
              x={QUOTE_SLOTS[i].x} y={QUOTE_SLOTS[i].y}
              dur={QUOTE_SLOTS[i].dur} delay={QUOTE_SLOTS[i].delay}
              onCycle={() => cycleSlot(i)}
            />
          ) : null
        )}
      </div>

      {/* ── Title screen ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative pointer-events-none" style={{ zIndex: 2 }}>

        {/* Title */}
        <div className="text-center px-6">
          <h1
            className="font-jacquard text-tavern-gold leading-none"
            style={{
              fontSize: 'clamp(5.5rem, 24vw, 10rem)',
              textShadow: '0 0 24px rgba(212,175,55,0.5), 0 3px 10px rgba(0,0,0,0.9)',
            }}
          >
            Tabletop Tales
          </h1>
        </div>

        {/* TELL A NEW TALE button — re-enable pointer events just for this element */}
        <div
          className="border border-tavern-gold/60 rounded pointer-events-auto"
          style={{
            padding: '10px 20px',
            background: 'rgba(212,175,55,0.05)',
          }}
        >
          <Link
            to="/log"
            className="text-tavern-gold"
            style={{
              fontFamily: "'Pixelify Sans', sans-serif",
              fontSize: '14px',
              letterSpacing: '0.08em',
            }}
          >
            TELL A NEW TALE
          </Link>
        </div>

      </div>

      {/* Sky → scene gradient */}
      <div
        className="w-full pointer-events-none"
        style={{
          height: '60px',
          background: 'linear-gradient(to bottom, transparent, #060a23)',
          marginBottom: '-2px',
          position: 'relative',
          zIndex: 2,
        }}
      />

      {/* Pixel art campfire scene */}
      <div className="w-full" style={{ zIndex: 2 }}>
        <img
          src="/fire_scene.webp"
          alt="Adventurers around a campfire"
          className="w-full block"
          style={{ imageRendering: 'pixelated', aspectRatio: '100 / 56' }}
        />
      </div>

      {/* Ground strip */}
      <div
        className="w-full shrink-0"
        style={{ background: '#230d09', height: '24px', zIndex: 2 }}
      />

    </div>
  )
}
