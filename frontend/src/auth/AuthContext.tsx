import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '@/api/client'

export interface User {
  id: number
  email: string
  username: string
  created_at: string
  updated_at: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  sendLoginEmail: (email: string) => Promise<void>
  verifyCode: (code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api
      .get<User | undefined>('/api/auth/me')
      .then((data) => {
        if (data) setUser(data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const sendLoginEmail = useCallback(async (email: string) => {
    await api.post('/api/auth/send-link', { email })
  }, [])

  const verifyCode = useCallback(async (code: string) => {
    const data = await api.post<User>('/api/auth/verify', { code })
    setUser(data)
  }, [])

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout')
    setUser(null)
  }, [])

  return (
    <AuthContext value={{ user, isLoading, sendLoginEmail, verifyCode, logout }}>
      {children}
    </AuthContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
