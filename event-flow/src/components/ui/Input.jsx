import { cn } from '../../utils'

/**
 * Input
 * @param {'text'|'search'|'date'|'number'|'email'|'password'} type
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 * @param {string} error
 */
function Input({
  type = 'text',
  leftIcon,
  rightIcon,
  error,
  className,
  ...props
}) {
  return (
    <div className="relative flex items-center">
      {leftIcon && (
        <span className="absolute left-3 text-neutral-500 pointer-events-none">
          {leftIcon}
        </span>
      )}
      <input
        type={type}
        className={cn(
          'w-full h-9 rounded-lg border bg-white text-neutral-900 text-sm',
          'placeholder:text-neutral-500',
          'transition-colors duration-150',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
          error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-neutral-300',
          leftIcon  && 'pl-9',
          rightIcon && 'pr-9',
          !leftIcon && !rightIcon && 'px-3',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 text-neutral-500">
          {rightIcon}
        </span>
      )}
    </div>
  )
}

export default Input
