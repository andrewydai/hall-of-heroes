import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4" style={{ background: '#060a23' }}>
      <h1 className="font-jacquard text-tavern-gold mb-2" style={{ fontSize: '3rem' }}>404</h1>
      <p className="text-blue-300 mb-6 text-sm">This tale has not been written.</p>
      <Link to="/" className="text-tavern-amber underline text-sm">
        Return to the Hall
      </Link>
    </main>
  )
}
