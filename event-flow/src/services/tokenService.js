const TOKEN_KEY = 'eventflow_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getActiveToken() {
  const token = getToken()
  const payload = decodeTokenPayload(token)

  if (!token || (payload?.exp && payload.exp * 1000 <= Date.now())) {
    if (token) clearToken()
    return null
  }

  return token
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function decodeTokenPayload(token = getToken()) {
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    )

    return JSON.parse(window.atob(paddedPayload))
  } catch {
    return null
  }
}

export function getTokenUserId(token = getActiveToken()) {
  const payload = decodeTokenPayload(token)
  const userId = payload?.uid ?? payload?.userId ?? payload?.id

  return userId ? Number(userId) : null
}
