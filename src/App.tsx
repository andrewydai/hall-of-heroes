import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import PlayersList from './pages/PlayersList'
import PlayerPage from './pages/PlayerPage'
import GamesList from './pages/GamesList'
import GamePage from './pages/GamePage'
import SessionsList from './pages/SessionsList'
import SessionDetail from './pages/SessionDetail'
import LogSession from './pages/LogSession'
import Admin from './pages/Admin'
import Trivia from './pages/Trivia'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sessions" element={<SessionsList />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/players" element={<PlayersList />} />
          <Route path="/players/:id" element={<PlayerPage />} />
          <Route path="/games" element={<GamesList />} />
          <Route path="/games/:id" element={<GamePage />} />
          <Route path="/log" element={<LogSession />} />
          <Route path="/trivia" element={<Trivia />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
