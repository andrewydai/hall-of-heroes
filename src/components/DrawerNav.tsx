import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/',         label: 'Home' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/players',  label: 'Players' },
  { to: '/games',    label: 'Games' },
  { to: '/trivia',   label: 'Trivia' },
  { to: '/admin',    label: 'Admin' },
]

export default function DrawerNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const close = () => setOpen(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="p-1 text-blue-300 hover:text-tavern-gold transition-colors"
      >
        <HamburgerIcon />
      </button>

      {/* Dark backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-64 border-l border-blue-900 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: '#050920' }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-900">
          <span className="font-jacquard text-tavern-gold" style={{ fontSize: '1.4rem' }}>Tabletop Tales</span>
          <button
            onClick={close}
            aria-label="Close navigation"
            className="text-blue-400 hover:text-blue-100 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 p-3">
          {NAV_LINKS.map(({ to, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={close}
                className={`px-3 py-3 rounded text-sm transition-colors ${
                  active
                    ? 'bg-blue-900/30 text-tavern-gold'
                    : 'text-blue-200 hover:text-tavern-gold hover:bg-blue-900/20'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Log Session CTA */}
        <div className="p-4 border-t border-blue-900">
          <Link
            to="/log"
            onClick={close}
            className="block text-center border border-tavern-gold/50 text-tavern-gold px-4 py-3 rounded hover:bg-tavern-gold/10 transition-colors"
            style={{ fontFamily: "'Pixelify Sans', sans-serif", fontSize: '13px' }}
          >
            + LOG A SESSION
          </Link>
        </div>
      </div>
    </>
  )
}

function HamburgerIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden>
      <rect y="0"  width="22" height="2" rx="1" fill="currentColor" />
      <rect y="7"  width="22" height="2" rx="1" fill="currentColor" />
      <rect y="14" width="22" height="2" rx="1" fill="currentColor" />
    </svg>
  )
}
