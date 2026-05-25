import axios from 'axios'

import { clearToken, getActiveToken } from '../services/tokenService'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getActiveToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?sessionExpired=1')
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
