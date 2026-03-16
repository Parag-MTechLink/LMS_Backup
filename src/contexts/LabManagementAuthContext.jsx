import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService, clearCache } from '../services/labManagementApi'

const STORAGE_TOKEN = 'labManagementAccessToken'
const STORAGE_USER = 'labManagementUser'

const AuthContext = createContext(undefined)

export function LabManagementAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(() => {
    const token = localStorage.getItem(STORAGE_TOKEN)
    const storedUser = localStorage.getItem(STORAGE_USER)
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(STORAGE_TOKEN)
        localStorage.removeItem(STORAGE_USER)
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_TOKEN)
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    authService
      .me()
      .then((data) => {
        const u = {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          name: data.full_name,
          role: data.role,
          is_active: data.is_active,
          is_main: data.is_main,
        }
        setUser(u)
        localStorage.setItem(STORAGE_USER, JSON.stringify(u))
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_TOKEN)
        localStorage.removeItem(STORAGE_USER)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onStorage = () => loadUser()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [loadUser])

  const login = async (email, password) => {
    const res = await authService.login(email, password)
    localStorage.setItem(STORAGE_TOKEN, res.access_token)
    const u = {
      id: res.user.id,
      email: res.user.email,
      full_name: res.user.full_name,
      name: res.user.full_name,
      role: res.user.role,
      is_main: res.user.is_main,
    }
    localStorage.setItem(STORAGE_USER, JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_USER)
    clearCache('auth:')
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshUser: loadUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useLabManagementAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useLabManagementAuth must be used within a LabManagementAuthProvider')
  }
  return context
}
