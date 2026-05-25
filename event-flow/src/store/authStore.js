import { create } from 'zustand'

import { clearToken, getActiveToken, setToken } from '../services/tokenService'

const initialToken = getActiveToken()

const useAuthStore = create((set) => ({
  user: null,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),

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
