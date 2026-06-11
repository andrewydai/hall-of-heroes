import { Link } from 'react-router-dom'
import type { SessionSummary } from '../types'
import LoadingSpinner from './LoadingSpinner'

// ---------------------------------------------------------------------------
// Wood textures via layered CSS gradients.
// Frame uses a warm golden-brown; surface is darker so notes contrast well.
// ---------------------------------------------------------------------------
const WOOD_FRAME = [
  'repeating-linear-gradient(91deg, transparent 0, transparent 8px, rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.04) 9px)',
  'repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px)',
  'linear-gradient(166deg, #7a5535 0%, #4a3120 22%, #8b6340 44%, #3d2b1a 62%, #6b4a2a 82%, #4a3120 100%)',
].join(', ')

const WOOD_SURFACE = [
  'repeating-linear-gradient(180deg, transparent 0, transparent 38px, rgba(0,0,0,0.22) 38px, rgba(0,0,0,0.22) 40px)',
  'repeating-linear-gradient(90deg, rgba(0,0,0,0.015) 0, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 55px)',
  'linear-gradient(177deg, #1e1208 0%, #2d1a0a 28%, #1a1006 54%, #26180a 78%, #1e1208 100%)',
].join(', ')

// ---------------------------------------------------------------------------
// Pre-computed note layout — stable rotations and offsets for a scattered look
// without Math.random (which would re-shuffle on every render).
// ---------------------------------------------------------------------------
const NOTE_LAYOUT = [
  { rot: -5, tx: -6,  ty:  8, z: 3 },
  { rot:  3, tx:  7,  ty: -4, z: 7 },
  { rot: -7, tx: -2,  ty:  6, z: 1 },
  { rot:  4, tx:  5,  ty:  7, z: 5 },
  { rot: -2, tx: -9,  ty:  2, z: 9 },
  { rot:  6, tx:  3,  ty: -7, z: 2 },
  { rot: -4, tx: -5,  ty:  9, z: 6 },
  { rot:  5, tx:  8,  ty: -3, z: 4 },
  { rot: -6, tx: -3,  ty:  5, z: 8 },
]

// ---------------------------------------------------------------------------
// Single pinned note
// ---------------------------------------------------------------------------
function QuoteNote({ session, layout }: { session: SessionSummary; layout: typeof NOTE_LAYOUT[number] }) {
  const { rot, tx, ty, z } = layout

  const outcome = session.victor_names
    ? `${session.victor_names.split(',').join(' & ')} won`
    : session.coop_result === 'win'        ? 'Co-op victory'
    : session.coop_result === 'loss'       ? 'Co-op defeat'
    : session.coop_result === 'in_progress' ? 'In progress'
    : null

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="block relative group"
      style={{ transform: `rotate(${rot}deg) translate(${tx}px, ${ty}px)`, zIndex: z }}
    >
      {/* Thumbtack */}
      <div
        className="absolute left-1/2 -top-2 -translate-x-1/2 w-3 h-3 rounded-full z-10"
        style={{
          background: 'radial-gradient(circle at 38% 35%, #e05555, #8b1a1a)',
          boxShadow: '1px 2px 5px rgba(0,0,0,0.65)',
        }}
      />

      {/* Parchment paper */}
      <div
        className="bg-parchment-100 px-2.5 pt-4 pb-2 group-hover:brightness-105 transition-[filter]"
        style={{
          borderRadius: '1px 2px 2px 1px',
          boxShadow: '2px 4px 14px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4), inset 0 0 12px rgba(0,0,0,0.04)',
        }}
      >
        {session.quote ? (
          <p
            className="font-fell italic text-tavern-brown leading-snug line-clamp-3 mb-1.5"
            style={{ fontSize: '11px' }}
          >
            "{session.quote}"
          </p>
        ) : (
          <p
            className="font-fell italic text-parchment-600 leading-snug mb-1.5 opacity-50"
            style={{ fontSize: '11px' }}
          >
            (no quote)
          </p>
        )}
        <div className="border-t border-parchment-300 pt-1 flex flex-col gap-px">
          <span
            className="text-tavern-wood font-semibold tracking-wide truncate block"
            style={{ fontSize: '9px' }}
          >
            {session.game_name}
          </span>
          {outcome && (
            <span className="text-parchment-500 truncate block" style={{ fontSize: '9px' }}>
              {outcome}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Board post (leg)
// ---------------------------------------------------------------------------
function Post() {
  return (
    <div
      style={{
        width: '18px',
        height: '56px',
        background: WOOD_FRAME,
        borderLeft: '1px solid #5c3d1e',
        borderRight: '1px solid #5c3d1e',
        borderBottom: '1px solid #4a3120',
        boxShadow: '2px 3px 10px rgba(0,0,0,0.55)',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Notice board
// ---------------------------------------------------------------------------
interface Props {
  sessions: SessionSummary[]
  loading: boolean
}

export default function NoticeBoard({ sessions, loading }: Props) {
  const notes = sessions.slice(0, NOTE_LAYOUT.length)

  return (
    <div className="w-full max-w-sm mx-auto">

      {/* Eave — slightly wider than the frame to create an overhang */}
      <div
        className="-mx-2 relative z-10 flex flex-col items-center justify-center py-3 px-4"
        style={{
          background: WOOD_FRAME,
          borderTop: '3px solid #a07848',
          borderLeft: '3px solid #a07848',
          borderRight: '3px solid #a07848',
          borderRadius: '5px 5px 0 0',
          boxShadow: [
            '0 12px 30px rgba(0,0,0,0.8)',   // shadow falls onto board below
            'inset 0 1px 0 rgba(255,255,255,0.09)',
            'inset 0 -4px 10px rgba(0,0,0,0.35)',
          ].join(', '),
        }}
      >
        {/* Decorative nail heads at top corners */}
        <div className="absolute top-2 left-3 w-2 h-2 rounded-full bg-parchment-800 opacity-60" />
        <div className="absolute top-2 right-3 w-2 h-2 rounded-full bg-parchment-800 opacity-60" />

        <h1
          className="font-cinzel text-tavern-gold tracking-widest text-lg"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7), 0 0 18px rgba(212,175,55,0.35)' }}
        >
          Hall of Heroes
        </h1>
        <p
          className="font-fell italic text-parchment-500 tracking-wider mt-0.5"
          style={{ fontSize: '10px' }}
        >
          Chronicle of Legends
        </p>
      </div>

      {/* Frame */}
      <div
        style={{
          background: WOOD_FRAME,
          padding: '14px',
          border: '2px solid #5c3d1e',
          borderTop: 'none',
          boxShadow: '4px 6px 28px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(0,0,0,0.2)',
        }}
      >
        {/* Inner board surface */}
        <div
          className="relative overflow-hidden"
          style={{
            background: WOOD_SURFACE,
            minHeight: '380px',
            boxShadow: [
              'inset 0 8px 20px rgba(0,0,0,0.65)',
              'inset 5px 0 14px rgba(0,0,0,0.35)',
              'inset -5px 0 14px rgba(0,0,0,0.35)',
              'inset 0 -4px 12px rgba(0,0,0,0.3)',
            ].join(', '),
          }}
        >
          {/* Torch glow — warm amber light rising from below the board */}
          <div
            className="absolute inset-0 pointer-events-none animate-flicker"
            style={{
              background: [
                'radial-gradient(ellipse 110% 55% at 50% 122%, rgba(215,95,10,0.42), transparent)',
                'radial-gradient(ellipse 55% 80% at -5% 108%, rgba(190,72,5,0.28), transparent)',
                'radial-gradient(ellipse 55% 80% at 105% 108%, rgba(190,72,5,0.28), transparent)',
              ].join(', '),
            }}
          />

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner message="Consulting the archives…" />
            </div>
          )}

          {/* Empty state */}
          {!loading && notes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
              <p className="font-fell italic text-parchment-700 text-sm">
                No tales have been posted yet.
              </p>
            </div>
          )}

          {/* Notes — 3-column grid, each shifted and rotated for a scattered look */}
          {!loading && notes.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-5 pt-7">
              {notes.map((session, i) => (
                <QuoteNote key={session.id} session={session} layout={NOTE_LAYOUT[i]} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Support posts */}
      <div className="flex justify-between px-12">
        <Post />
        <Post />
      </div>

    </div>
  )
}
