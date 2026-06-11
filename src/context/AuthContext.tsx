import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'

// Three states: we don't know yet, we know they're in, we know they're out.
// 'loading' prevents a flash of the passcode screen on page load when the
// user already has a valid session cookie.
type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  state: AuthState
  login: (passcode: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading')

  // On mount, ask the server if the existing session cookie (if any) is valid.
  // This is the only way to check httpOnly cookies from JS — we can't read them directly.
  useEffect(() => {
    api.auth.me()
      .then(() => setState('authenticated'))
      .catch(() => setState('unauthenticated'))
  }, [])

  const login = useCallback(async (passcode: string) => {
    await api.auth.login(passcode) // throws ApiError on wrong passcode
    setState('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await api.auth.logout()
    setState('unauthenticated')
  }, [])

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
