/**
 * @param {object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} props.actions
 */
function PageHeader({ title, actions = null }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export default PageHeader
