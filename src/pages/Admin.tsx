import { useState, useEffect, type FormEvent } from 'react'
import { api, ApiError } from '../lib/api'
import type { Player, Game, SessionSummary, SessionWithDetails } from '../types'

const inp = 'border border-blue-900 rounded px-2 py-1 text-blue-100 text-sm focus:outline-none focus:border-tavern-gold w-full'
const inpStyle = { background: '#030614' }
const btn = (variant: 'primary' | 'danger' | 'ghost' = 'ghost') =>
  `text-xs px-2 py-1 rounded border font-medium ${
    variant === 'primary' ? 'border-tavern-gold text-tavern-gold hover:bg-tavern-gold/10' :
    variant === 'danger'  ? 'border-red-600 text-red-400 hover:bg-red-900/20' :
                            'border-blue-800 text-blue-400 hover:bg-blue-900/20'
  }`

// ---------------------------------------------------------------------------
// Auth gate
// ---------------------------------------------------------------------------

function AdminGate({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<'loading' | 'in' | 'out'>('loading')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.admin.auth.me()
      .then(() => setAuthState('in'))
      .catch(() => setAuthState('out'))
  }, [])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.admin.auth.login(passcode)
      setAuthState('in')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Wrong passcode.' : 'Error — try again.')
      setSubmitting(false)
    }
  }

  if (authState === 'loading') {
    return <p className="p-8 text-blue-400 text-sm">Loading…</p>
  }

  if (authState === 'out') {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6" style={{ background: '#060a23' }}>
        <div className="w-full max-w-xs border border-blue-900 rounded-lg p-8" style={{ background: 'rgba(10,20,60,0.5)' }}>
          <h1 className="font-jacquard text-tavern-gold text-center mb-6" style={{ fontSize: '1.8rem' }}>Admin</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="Admin passcode"
              autoFocus
              className={inp + ' text-center tracking-widest'} style={inpStyle}
              style={inpStyle}
            />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit" disabled={submitting || !passcode} className={btn('primary') + ' py-2 w-full'}>
              {submitting ? 'Verifying…' : 'Enter'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return <>{children}</>
}

// ---------------------------------------------------------------------------
// Players tab
// ---------------------------------------------------------------------------

function PlayersTab() {
  const [players, setPlayers] = useState<Player[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', display_name: '', avatar_url: '' })
  const [addForm, setAddForm] = useState({ name: '', display_name: '', avatar_url: '' })
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const data = await api.players.list()
    setPlayers(data)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.admin.players.create(addForm)
      setAddForm({ name: '', display_name: '', avatar_url: '' })
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function startEdit(p: Player) {
    setEditingId(p.id)
    setEditForm({ name: p.name, display_name: p.display_name ?? '', avatar_url: p.avatar_url ?? '' })
  }

  async function handleSave(id: string) {
    setError(null)
    try {
      await api.admin.players.update(id, editForm)
      setEditingId(null)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this player? Their session records will also be removed.')) return
    setError(null)
    try {
      await api.admin.players.delete(id)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-28">
          <label className="text-blue-400 text-xs">Name (slug)</label>
          <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="emily" className={inp} style={inpStyle} required />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-28">
          <label className="text-blue-400 text-xs">Display name</label>
          <input value={addForm.display_name} onChange={e => setAddForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Emily" className={inp} style={inpStyle} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-28">
          <label className="text-blue-400 text-xs">Avatar URL</label>
          <input value={addForm.avatar_url} onChange={e => setAddForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="/avatars/bard.png" className={inp} style={inpStyle} />
        </div>
        <button type="submit" className={btn('primary')}>Add Player</button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-blue-400 text-xs text-left border-b border-blue-900/60">
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Display</th>
              <th className="pb-2 pr-4">Avatar</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => editingId === p.id ? (
              <tr key={p.id} className="border-b border-blue-900/40">
                <td className="py-2 pr-4 text-blue-500 text-xs">{p.id}</td>
                <td className="py-2 pr-2"><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inp} style={inpStyle} /></td>
                <td className="py-2 pr-2"><input value={editForm.display_name} onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))} className={inp} style={inpStyle} /></td>
                <td className="py-2 pr-2"><input value={editForm.avatar_url} onChange={e => setEditForm(f => ({ ...f, avatar_url: e.target.value }))} className={inp} style={inpStyle} /></td>
                <td className="py-2 flex gap-1">
                  <button onClick={() => handleSave(p.id)} className={btn('primary')}>Save</button>
                  <button onClick={() => setEditingId(null)} className={btn()}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={p.id} className="border-b border-blue-900/40 hover:bg-blue-900/20">
                <td className="py-2 pr-4 text-blue-500 text-xs">{p.id}</td>
                <td className="py-2 pr-4 text-blue-100">{p.name}</td>
                <td className="py-2 pr-4 text-blue-300">{p.display_name ?? '—'}</td>
                <td className="py-2 pr-4 text-blue-500 text-xs">{p.avatar_url ?? '—'}</td>
                <td className="py-2 flex gap-1">
                  <button onClick={() => startEdit(p)} className={btn()}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} className={btn('danger')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Games tab
// ---------------------------------------------------------------------------

function GamesTab() {
  const [games, setGames] = useState<Game[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', type: 'competitive', description: '', icon_path: '' })
  const [addForm, setAddForm] = useState({ name: '', type: 'competitive', description: '', icon_path: '' })
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const data = await api.games.list()
    setGames(data)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.admin.games.create(addForm)
      setAddForm({ name: '', type: 'competitive', description: '', icon_path: '' })
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function startEdit(g: Game) {
    setEditingId(g.id)
    setEditForm({ name: g.name, type: g.type, description: g.description ?? '', icon_path: g.icon_path ?? '' })
  }

  async function handleSave(id: string) {
    setError(null)
    try {
      await api.admin.games.update(id, editForm)
      setEditingId(null)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this game?')) return
    setError(null)
    try {
      await api.admin.games.delete(id)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const typeSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={e => onChange(e.target.value)} className={inp} style={inpStyle}>
      <option value="competitive">competitive</option>
      <option value="cooperative">cooperative</option>
    </select>
  )

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-28">
          <label className="text-blue-400 text-xs">Name</label>
          <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Wingspan" className={inp} style={inpStyle} required />
        </div>
        <div className="flex flex-col gap-1 w-36">
          <label className="text-blue-400 text-xs">Type</label>
          {typeSelect(addForm.type, v => setAddForm(f => ({ ...f, type: v })))}
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-40">
          <label className="text-blue-400 text-xs">Description</label>
          <input value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" className={inp} style={inpStyle} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-28">
          <label className="text-blue-400 text-xs">Image file</label>
          <input value={addForm.icon_path} onChange={e => setAddForm(f => ({ ...f, icon_path: e.target.value }))} placeholder="pixel_art_large" className={inp} style={inpStyle} />
        </div>
        <button type="submit" className={btn('primary')}>Add Game</button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-blue-400 text-xs text-left border-b border-blue-900/60">
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Description</th>
              <th className="pb-2 pr-4">Image</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {games.map(g => editingId === g.id ? (
              <tr key={g.id} className="border-b border-blue-900/40">
                <td className="py-2 pr-4 text-blue-500 text-xs">{g.id}</td>
                <td className="py-2 pr-2"><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inp} style={inpStyle} /></td>
                <td className="py-2 pr-2 w-36">{typeSelect(editForm.type, v => setEditForm(f => ({ ...f, type: v })))}</td>
                <td className="py-2 pr-2"><input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className={inp} style={inpStyle} /></td>
                <td className="py-2 pr-2"><input value={editForm.icon_path} onChange={e => setEditForm(f => ({ ...f, icon_path: e.target.value }))} placeholder="pixel_art_large" className={inp} style={inpStyle} /></td>
                <td className="py-2 flex gap-1">
                  <button onClick={() => handleSave(g.id)} className={btn('primary')}>Save</button>
                  <button onClick={() => setEditingId(null)} className={btn()}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={g.id} className="border-b border-blue-900/40 hover:bg-blue-900/20">
                <td className="py-2 pr-4 text-blue-500 text-xs">{g.id}</td>
                <td className="py-2 pr-4 text-blue-100">{g.name}</td>
                <td className="py-2 pr-4 text-blue-300">{g.type}</td>
                <td className="py-2 pr-4 text-blue-400 text-xs max-w-xs truncate">{g.description ?? '—'}</td>
                <td className="py-2 pr-4 text-blue-500 text-xs">{g.icon_path ?? '—'}</td>
                <td className="py-2 flex gap-1">
                  <button onClick={() => startEdit(g)} className={btn()}>Edit</button>
                  <button onClick={() => handleDelete(g.id)} className={btn('danger')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sessions tab
// ---------------------------------------------------------------------------

function SessionsTab() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ date: '', quote: '', notes: '', coop_result: '' })
  const [editGameType, setEditGameType] = useState<'competitive' | 'cooperative'>('competitive')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const data = await api.sessions.list(500)
    setSessions(data)
  }

  useEffect(() => { load() }, [])

  async function startEdit(s: SessionSummary) {
    // Fetch full session to get notes and game_type
    const full: SessionWithDetails = await api.sessions.get(s.id)
    setEditingId(s.id)
    setEditGameType(full.game_type)
    setEditForm({
      date:        full.date,
      quote:       full.quote ?? '',
      notes:       full.notes ?? '',
      coop_result: full.coop_result ?? '',
    })
  }

  async function handleSave(id: string) {
    setError(null)
    try {
      await api.admin.sessions.update(id, editForm)
      setEditingId(null)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this session? This cannot be undone.')) return
    setError(null)
    try {
      await api.admin.sessions.delete(id)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <p className="text-blue-500 text-xs">To add sessions, use the <a href="/log" className="text-tavern-amber underline">Log a Session</a> page.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-blue-400 text-xs text-left border-b border-blue-900/60">
              <th className="pb-2 pr-3">ID</th>
              <th className="pb-2 pr-3">Game</th>
              <th className="pb-2 pr-3">Date</th>
              <th className="pb-2 pr-3">Quote</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => editingId === s.id ? (
              <tr key={s.id} className="border-b border-blue-900/40 align-top">
                <td className="py-2 pr-3 text-blue-500 text-xs whitespace-nowrap">{s.id.slice(0, 8)}…</td>
                <td className="py-2 pr-3 text-blue-300 whitespace-nowrap">{s.game_name}</td>
                <td className="py-2 pr-2 w-32">
                  <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className={inp} style={inpStyle} />
                </td>
                <td className="py-2 pr-2">
                  <div className="flex flex-col gap-1">
                    <textarea value={editForm.quote} onChange={e => setEditForm(f => ({ ...f, quote: e.target.value }))} rows={2} placeholder="Quote" className={inp + ' resize-none'} style={inpStyle} />
                    <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" className={inp} style={inpStyle} />
                    {editGameType === 'cooperative' && (
                      <select value={editForm.coop_result} onChange={e => setEditForm(f => ({ ...f, coop_result: e.target.value }))} className={inp} style={inpStyle}>
                        <option value="">— no result —</option>
                        <option value="win">win</option>
                        <option value="loss">loss</option>
                        <option value="in_progress">in_progress</option>
                      </select>
                    )}
                  </div>
                </td>
                <td className="py-2 flex flex-col gap-1">
                  <button onClick={() => handleSave(s.id)} className={btn('primary')}>Save</button>
                  <button onClick={() => setEditingId(null)} className={btn()}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={s.id} className="border-b border-blue-900/40 hover:bg-blue-900/20 align-top">
                <td className="py-2 pr-3 text-blue-500 text-xs whitespace-nowrap">{s.id.slice(0, 8)}…</td>
                <td className="py-2 pr-3 text-blue-300 whitespace-nowrap">{s.game_name}</td>
                <td className="py-2 pr-3 text-blue-300 whitespace-nowrap">{s.date}</td>
                <td className="py-2 pr-3 text-blue-400 text-xs max-w-xs">
                  {s.quote ? `"${s.quote.slice(0, 60)}${s.quote.length > 60 ? '…' : ''}"` : '—'}
                </td>
                <td className="py-2 flex gap-1 whitespace-nowrap">
                  <button onClick={() => startEdit(s)} className={btn()}>Edit</button>
                  <button onClick={() => handleDelete(s.id)} className={btn('danger')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard + page root
// ---------------------------------------------------------------------------

type Tab = 'players' | 'games' | 'sessions'

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('players')

  async function handleLogout() {
    await api.admin.auth.logout()
    window.location.reload()
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`text-sm px-4 py-2 border-b-2 transition-colors ${
        tab === t
          ? 'border-tavern-gold text-tavern-gold'
          : 'border-transparent text-blue-500 hover:text-blue-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-dvh" style={{ background: '#060a23' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-jacquard text-tavern-gold" style={{ fontSize: '2rem' }}>Admin</h1>
          <button onClick={handleLogout} className={btn()}>Log out</button>
        </div>

        <div className="flex border-b border-blue-900/60 mb-6">
          {tabBtn('players',  'Players')}
          {tabBtn('games',    'Games')}
          {tabBtn('sessions', 'Sessions')}
        </div>

        {tab === 'players'  && <PlayersTab />}
        {tab === 'games'    && <GamesTab />}
        {tab === 'sessions' && <SessionsTab />}
      </div>
    </div>
  )
}

export default function Admin() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  )
}
