import { cn } from '../../utils'

/**
 * @param {object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} props.headerRight
 * @param {boolean} props.noPadding
 * @param {string} props.className
 * @param {import('react').ReactNode} props.children
 */
function Card({ title = '', headerRight = null, noPadding = false, className = '', children }) {
  return (
    <section className={cn('rounded-xl border border-neutral-300 bg-white shadow-sm', className)}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3">
          {title && <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>}
          {headerRight}
        </div>
      )}
      <div className={cn(!noPadding && 'p-4')}>{children}</div>
    </section>
  )
}

export default Card
