import { create } from 'zustand'

import { clearToken, getToken, setToken } from '../services/tokenService'

const useAuthStore = create((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: Boolean(getToken()),

  setAuth: (user, token) => {
    setToken(token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    clearToken()
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

export default useAuthStore
