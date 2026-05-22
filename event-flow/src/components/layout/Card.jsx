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
    <section className={cn('rounded-xl border border-neutral-200 bg-white shadow-sm', className)}>
      {(title || headerRight) && (
        <div className="flex flex-col gap-3 border-b border-neutral-100 bg-neutral-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {title && <h2 className="text-base font-bold text-neutral-900">{title}</h2>}
          {headerRight}
        </div>
      )}
      <div className={cn(!noPadding && 'p-4')}>{children}</div>
    </section>
  )
}

export default Card
