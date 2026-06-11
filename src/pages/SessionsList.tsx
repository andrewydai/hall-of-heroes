import PageLayout from '../components/PageLayout'
import SessionCard from '../components/SessionCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'

export default function SessionsList() {
  const { data: sessions, loading, error } = useApi(() => api.sessions.list(100), 'sessions-list')

  return (
    <PageLayout>
      <h1 className="font-jacquard text-tavern-gold mb-6" style={{ fontSize: '2.2rem' }}>Sessions</h1>

      {loading && <LoadingSpinner message="Consulting the archives…" />}
      {error && <ErrorMessage message={error} />}

      {sessions && sessions.length === 0 && (
        <p className="text-blue-400 text-sm italic text-center py-12">
          No sessions recorded yet.
        </p>
      )}

      {sessions && sessions.length > 0 && (
        <div className="flex flex-col gap-3">
          {sessions.map(s => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
