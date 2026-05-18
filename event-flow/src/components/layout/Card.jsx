import { cn } from '../../utils'

/**
 * Card
 * @param {string} title
 * @param {React.ReactNode} headerRight - slot right of title
 * @param {React.ReactNode} footer
 * @param {boolean} noPadding
 */
function Card({ title, headerRight, footer, noPadding = false, className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-300 shadow-sm',
        className
      )}
      {...props}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-4')}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-neutral-100">{footer}</div>
      )}
    </div>
  )
}

export default Card
