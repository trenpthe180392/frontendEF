import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getToken, setToken, clearToken } from '../api/tokenService' // Import trực tiếp service của bạn

const useAuthStore = create(
  persist(
    (set) => ({
      // Khởi tạo trạng thái ban đầu: Nếu đã có token trong máy thì tạm thời coi là đã xác thực
      user: null,
      token: getToken() || null,
      isAuthenticated: !!getToken(), 

      setAuth: (user, token) => {
        setToken(token) // Dùng đồng bộ qua tokenService
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        clearToken() // Dùng đồng bộ qua tokenService
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : updates })),
    }),
    {
      name: 'eventflow-auth',
      // Chỉ đồng bộ user object qua persist, token đã có tokenService lo riêng để tránh xung đột
      partialize: (state) => ({ user: state.user }), 
    }
  )
)

export default useAuthStore