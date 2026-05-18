import { create } from 'zustand'

let toastId = 0

const useToastStore = create((set) => ({
  toasts: [],

  addToast: ({ message, variant = 'info', duration = 3500 }) => {
    const id = ++toastId
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant, duration }],
    }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export default useToastStore
