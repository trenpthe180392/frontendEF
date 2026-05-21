import { cn } from '../../utils'

/**
 * @param {object} props
 * @param {string} props.error
 * @param {string} props.className
 * @param {import('react').ReactNode} props.children
 */
function Select({ error = '', className = '', children, ...props }) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 outline-none transition-colors',
        error
          ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/10'
          : 'border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/10',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export default Select
