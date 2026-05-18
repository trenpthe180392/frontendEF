import { Loader2 } from 'lucide-react'
import { cn } from '../../utils'

const variantClasses = {
  primary:
    'bg-primary text-white hover:bg-primary-light active:bg-primary-dark shadow-btn disabled:bg-primary/50',
  secondary:
    'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-40',
  danger:
    'bg-danger text-white hover:bg-red-600 active:bg-red-700 disabled:bg-danger/50',
}

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-base gap-2',
}

/**
 * Button
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} disabled
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 * @param {string} className
 */
function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 cursor-pointer',
        'select-none whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}

export default Button
