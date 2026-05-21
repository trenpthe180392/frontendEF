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
 * @param {import('react').ReactNode} props.children
 */
function Badge({ variant = 'default', children }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}

export default Badge
