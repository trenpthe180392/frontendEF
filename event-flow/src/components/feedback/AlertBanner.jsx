import { useEffect, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const variantClasses = {
  error: 'border-danger/20 bg-danger-bg text-danger',
  success: 'border-success/20 bg-success-bg text-success',
  warning: 'border-warning/20 bg-warning-bg text-warning',
  info: 'border-info/20 bg-info-bg text-info',
}

const iconMap = {
  error: TriangleAlert,
  warning: TriangleAlert,
  success: CheckCircle2,
  info: Info,
}

const titleMap = {
  error: 'Không thể thực hiện',
  warning: 'Cần chú ý',
  success: 'Thành công',
  info: 'Thông báo',
}

/**
 * @param {object} props
 * @param {'error'|'success'|'warning'|'info'} props.variant
 * @param {string} props.message
 */
function AlertBanner({ variant = 'info', message }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [message])

  if (!message || dismissed) return null

  const Icon = iconMap[variant] || Info
  const title = titleMap[variant] || titleMap.info
  const close = () => setDismissed(true)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/45 p-4" onClick={close}>
      <div
        className={`w-full max-w-md rounded-2xl border bg-white p-4 shadow-2xl ${variantClasses[variant]}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70">
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{title}</p>
            <p className="mt-1 text-sm leading-6">{message}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 opacity-70 transition hover:bg-white/70 hover:opacity-100"
            onClick={close}
            aria-label="Đóng thông báo"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertBanner
