import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../utils'
import useToastStore from '../../store/toastStore'

// ─── TOAST ITEM ───────────────────────────────────────────
const variantConfig = {
  success: { icon: CheckCircle,    bg: 'bg-success-bg border-success/20', text: 'text-success' },
  error:   { icon: XCircle,        bg: 'bg-danger-bg  border-danger/20',  text: 'text-danger'  },
  warning: { icon: AlertTriangle,  bg: 'bg-warning-bg border-warning/20', text: 'text-warning' },
  info:    { icon: Info,           bg: 'bg-info-bg    border-info/20',    text: 'text-info'    },
}

function ToastItem({ id, message, variant = 'info' }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const { icon: Icon, bg, text } = variantConfig[variant] || variantConfig.info

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg w-80 max-w-full',
        bg
      )}
    >
      <Icon size={16} className={cn('shrink-0 mt-0.5', text)} />
      <p className="text-sm text-neutral-700 flex-1">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── TOAST CONTAINER ──────────────────────────────────────
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto animate-in slide-in-from-right-5 fade-in duration-200">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  )
}

// ─── ALERT BANNER ─────────────────────────────────────────
/**
 * AlertBanner — inline alert trong page
 * @param {'success'|'error'|'warning'|'info'} variant
 * @param {string} message
 * @param {boolean} dismissible
 */
export function AlertBanner({ variant = 'info', message, dismissible = false, onDismiss, className }) {
  const { icon: Icon, bg, text } = variantConfig[variant] || variantConfig.info

  return (
    <div className={cn('flex items-start gap-3 px-4 py-3 rounded-xl border', bg, className)}>
      <Icon size={16} className={cn('shrink-0 mt-0.5', text)} />
      <p className="text-sm text-neutral-700 flex-1">{message}</p>
      {dismissible && (
        <button onClick={onDismiss} className="shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
