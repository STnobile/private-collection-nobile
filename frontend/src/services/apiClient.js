const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

const ACCESS_TOKEN_KEY = 'pcn.accessToken'
const REFRESH_TOKEN_KEY = 'pcn.refreshToken'

let isRefreshing = false
let refreshPromise = null

const getStoredToken = (key) => (typeof window !== 'undefined' ? localStorage.getItem(key) : null)
const setStoredToken = (key, value) => {
  if (typeof window === 'undefined') return
  if (value) {
    localStorage.setItem(key, value)
  } else {
    localStorage.removeItem(key)
  }
}

export const getAccessToken = () => getStoredToken(ACCESS_TOKEN_KEY)
export const getRefreshToken = () => getStoredToken(REFRESH_TOKEN_KEY)

export const setAuthTokens = ({ accessToken, refreshToken }) => {
  setStoredToken(ACCESS_TOKEN_KEY, accessToken)
  setStoredToken(REFRESH_TOKEN_KEY, refreshToken)
}

export const clearAuthTokens = () => {
  setStoredToken(ACCESS_TOKEN_KEY, null)
  setStoredToken(REFRESH_TOKEN_KEY, null)
}

const buildUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

const parseError = async (response) => {
  try {
    const data = await response.json()
    if (Array.isArray(data.detail)) {
      return data.detail.map((item) => item.msg).join(', ')
    }
    return data.detail || data.message || JSON.stringify(data)
  } catch (error) {
    return response.statusText || 'Unknown error'
  }
}

const refreshAccessToken = async () => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  isRefreshing = true
  refreshPromise = fetch(buildUrl('/token/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const message = await parseError(response)
        throw new Error(message || 'Unable to refresh token')
      }
      const data = await response.json()
      setAuthTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
      return data.access_token
    })
    .finally(() => {
      isRefreshing = false
      refreshPromise = null
    })

  return refreshPromise
}

export const apiRequest = async (
  path,
  { method = 'GET', headers = {}, body, auth = true, retry = true } = {},
) => {
  const finalHeaders = { ...headers }
  let payload = body

  if (body && !(body instanceof FormData) && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (body && finalHeaders['Content-Type'] === 'application/json') {
    payload = JSON.stringify(body)
  }

  if (auth) {
    const token = getAccessToken()
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: finalHeaders,
    body: payload,
  })

  if (response.status === 401 && auth && retry) {
    try {
      const newAccessToken = await refreshAccessToken()
      if (!newAccessToken) {
        throw new Error('Unable to refresh access token')
      }
      return apiRequest(path, { method, headers, body, auth, retry: false })
    } catch (error) {
      clearAuthTokens()
      throw error
    }
  }

  if (!response.ok) {
    const message = await parseError(response)
    throw new Error(message || 'Request failed')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
