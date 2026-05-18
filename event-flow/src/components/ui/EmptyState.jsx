import { cn } from '../../utils'

/**
 * EmptyState
 * @param {React.ReactNode} icon
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} action - CTA button
 */
function EmptyState({ icon, title = 'Chưa có dữ liệu', description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 mb-4">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-neutral-900 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-neutral-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
