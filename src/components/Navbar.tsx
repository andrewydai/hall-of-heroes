import { Link } from 'react-router-dom'
import DrawerNav from './DrawerNav'

export default function Navbar() {
  return (
    <nav
      className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b border-blue-900/40"
      style={{ background: 'rgba(6, 10, 35, 0.92)' }}
    >
      <Link to="/" className="font-jacquard text-tavern-gold" style={{ fontSize: '1.5rem' }}>
        Tabletop Tales
      </Link>
      <DrawerNav />
    </nav>
  )
}
