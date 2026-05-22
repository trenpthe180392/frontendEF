import { Loader2 } from 'lucide-react'

import { cn } from '../../utils'

const variantClasses = {
  primary: 'bg-primary text-white shadow-btn ring-1 ring-primary/15 hover:bg-primary-light hover:shadow-md active:bg-primary-dark',
  secondary: 'border border-neutral-300 bg-white text-neutral-800 shadow-sm hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark',
  ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950',
  danger: 'border border-danger bg-danger text-white shadow-sm hover:bg-danger/90',
}

const sizeClasses = {
  sm: 'h-8 gap-2 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-md',
}

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.loading
 * @param {boolean} props.disabled
 * @param {import('react').ReactNode} props.leftIcon
 * @param {string} props.className
 * @param {import('react').ReactNode} props.children
 */
function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  className = '',
  children,
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
      {children}
    </button>
  )
}

export default Button
