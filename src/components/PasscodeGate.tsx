import { useState, type ReactNode, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function PasscodeGate({ children }: { children: ReactNode }) {
  const { state, login } = useAuth()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (state === 'loading') {
    return (
      <main className="min-h-dvh flex items-center justify-center" style={{ background: '#060a23' }}>
        <span className="text-sm text-blue-400 animate-pulse">
          Consulting the archives…
        </span>
      </main>
    )
  }

  if (state === 'authenticated') {
    return <>{children}</>
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(passcode)
    } catch (err) {
      const message = err instanceof ApiError && err.status === 401
        ? 'Wrong passcode. Try again.'
        : 'Something went wrong. Try again.'
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6" style={{ background: '#060a23' }}>
      <div
        className="w-full max-w-sm border border-blue-900 rounded-lg p-8"
        style={{ background: 'rgba(10, 20, 60, 0.5)' }}
      >
        <h1 className="font-jacquard text-tavern-gold text-center mb-1" style={{ fontSize: '2rem' }}>
          Tabletop Tales
        </h1>
        <p className="text-blue-400 text-sm text-center mb-8">
          Speak the passcode to enter.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="••••••••"
            autoFocus
            autoComplete="current-password"
            className={[
              'border rounded px-4 py-3',
              'text-blue-100 placeholder-blue-800',
              'text-center tracking-[0.4em] text-sm',
              'focus:outline-none transition-colors',
              error
                ? 'border-red-600 focus:border-red-500'
                : 'border-blue-900 focus:border-tavern-gold',
            ].join(' ')}
            style={{ background: '#030614' }}
          />

          {error && (
            <p className="text-red-400 text-xs text-center -mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !passcode}
            className={[
              'border border-tavern-gold/60 rounded py-3 font-pixel transition-colors',
              'text-tavern-gold hover:bg-tavern-gold/10',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            ].join(' ')}
            style={{ fontSize: '9px' }}
          >
            {submitting ? 'Entering…' : 'Enter the Hall'}
          </button>
        </form>
      </div>
    </main>
  )
}
