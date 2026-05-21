import { Loader2 } from 'lucide-react'

import { cn } from '../../utils'

const variantClasses = {
  primary: 'bg-primary text-white shadow-btn hover:bg-primary-light active:bg-primary-dark',
  secondary: 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
  ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
  danger: 'bg-danger text-white hover:bg-danger/90',
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
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
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
