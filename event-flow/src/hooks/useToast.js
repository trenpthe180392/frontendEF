import useToastStore from '../store/toastStore'

/**
 * useToast — trigger toast notifications anywhere
 *
 * Usage:
 *   const { toast } = useToast()
 *   toast.success('Tạo thành công!')
 *   toast.error('Đã xảy ra lỗi')
 */
export function useToast() {
  const addToast = useToastStore((s) => s.addToast)

  return {
    toast: {
      success: (message, duration) => addToast({ message, variant: 'success', duration }),
      error:   (message, duration) => addToast({ message, variant: 'error',   duration }),
      warning: (message, duration) => addToast({ message, variant: 'warning', duration }),
      info:    (message, duration) => addToast({ message, variant: 'info',    duration }),
    },
  }
}
