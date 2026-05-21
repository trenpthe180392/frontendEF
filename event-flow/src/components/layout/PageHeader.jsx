/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {import('react').ReactNode} props.actions
 */
function PageHeader({ title, subtitle = '', actions = null }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export default PageHeader
