import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest, getAccessToken } from '../services/apiClient'
import { getStoredUser, loginUser, logoutUser, registerUser, setStoredUser } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  const initialize = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const currentUser = await apiRequest('/users/me', { auth: true })
      setUser(currentUser)
      setStoredUser(currentUser)
    } catch (error) {
      logoutUser()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleLogin = useCallback(async (email, password) => {
    const { user: loggedInUser } = await loginUser(email, password)
    setUser(loggedInUser)
    setStoredUser(loggedInUser)
    return loggedInUser
  }, [])

  const handleRegister = useCallback(
    async (payload) => {
      await registerUser(payload)
      // Auto login after successful registration
      return handleLogin(payload.email, payload.password)
    },
    [handleLogin],
  )

  const handleLogout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.is_admin),
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      setUser,
    }),
    [user, isLoading, handleLogin, handleRegister, handleLogout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
