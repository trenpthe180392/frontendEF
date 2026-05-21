import { cn } from '../../utils'

/**
 * @param {object} props
 * @param {string} props.error
 * @param {import('react').ReactNode} props.leftIcon
 * @param {string} props.className
 */
function Input({ error = '', leftIcon = null, className = '', ...props }) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-neutral-500">
          {leftIcon}
        </span>
      )}
      <input
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-500',
          leftIcon && 'pl-10',
          error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/10'
            : 'border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/10',
          className
        )}
        {...props}
      />
    </div>
  )
}

export default Input
