import { apiRequest, clearAuthTokens, setAuthTokens } from './apiClient'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

const USER_STORAGE_KEY = 'pcn.user'

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}

export const registerUser = async (payload) => {
  return apiRequest('/users/', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export const loginUser = async (email, password) => {
  const body = new URLSearchParams()
  body.append('username', email)
  body.append('password', password)

  const response = await fetch(`${API_BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.detail || errorData.message || 'Invalid credentials'
    throw new Error(message)
  }

  const data = await response.json()
  setAuthTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })

  const user = await apiRequest('/users/me', {
    auth: false,
    headers: {
      Authorization: `Bearer ${data.access_token}`,
    },
  })
  setStoredUser(user)
  return { user, tokens: data }
}

export const logoutUser = () => {
  setStoredUser(null)
  clearAuthTokens()
}
