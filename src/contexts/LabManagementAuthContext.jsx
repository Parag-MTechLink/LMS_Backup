import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService, clearCache } from '../services/labManagementApi'

const STORAGE_TOKEN = 'authToken'
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
          ...data,
          name: data.full_name, // fallback for components using .name
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
    
    if (res.mfa_required) {
      return res
    }

    localStorage.setItem(STORAGE_TOKEN, res.access_token)
    const u = {
      ...res.user,
      name: res.user.full_name,
    }
    localStorage.setItem(STORAGE_USER, JSON.stringify(u))
    setUser(u)
    return res
  }

  const verifyMfa = async (email, code) => {
    const res = await authService.verifyMfa(email, code)
    localStorage.setItem(STORAGE_TOKEN, res.access_token)
    const u = {
      ...res.user,
      name: res.user.full_name,
    }
    localStorage.setItem(STORAGE_USER, JSON.stringify(u))
    setUser(u)
    return res
  }

  const sendOtp = async (mobile) => {
    return await authService.sendOtp(mobile)
  }

  const loginWithOtp = async (mobile, otp) => {
    const res = await authService.verifyOtp(mobile, otp)
    localStorage.setItem(STORAGE_TOKEN, res.access_token)
    const u = {
      ...res.user,
      name: res.user.full_name,
    }
    localStorage.setItem(STORAGE_USER, JSON.stringify(u))
    setUser(u)
    return res
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
    verifyMfa,
    sendOtp,
    loginWithOtp,
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
