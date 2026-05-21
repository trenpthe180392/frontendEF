import { cn } from '../../utils'

/**
 * @param {object} props
 * @param {string} props.error
 * @param {string} props.className
 */
function Textarea({ error = '', className = '', ...props }) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-500',
        error
          ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/10'
          : 'border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/10',
        className
      )}
      {...props}
    />
  )
}

export default Textarea
