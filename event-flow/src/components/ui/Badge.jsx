import { cn } from '../../utils'

const variantClasses = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  default: 'bg-neutral-100 text-neutral-700',
}

/**
 * @param {object} props
 * @param {'success'|'warning'|'danger'|'info'|'default'} props.variant
 * @param {string} props.className
 * @param {import('react').ReactNode} props.children
 */
function Badge({ variant = 'default', className = '', children }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', variantClasses[variant] || variantClasses.default, className)}>
      {children}
    </span>
  )
}

export default Badge
