import { cn } from '../../utils'

const variantClasses = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger:  'bg-danger-bg  text-danger',
  info:    'bg-info-bg    text-info',
  default: 'bg-neutral-100 text-neutral-500',
  primary: 'bg-primary-bg text-primary',
  secondary: 'bg-secondary-bg text-secondary',
}

/**
 * Badge
 * @param {'success'|'warning'|'danger'|'info'|'default'|'primary'|'secondary'} variant
 * @param {'sm'|'md'} size
 */
function Badge({ variant = 'default', size = 'sm', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
