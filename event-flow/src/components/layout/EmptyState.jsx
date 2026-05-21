/**
 * @param {object} props
 * @param {import('react').ReactNode} props.icon
 * @param {string} props.title
 * @param {string} props.description
 * @param {import('react').ReactNode} props.action
 */
function EmptyState({ icon = null, title, description = '', action = null }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
      {icon && <div className="mb-3 text-neutral-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
