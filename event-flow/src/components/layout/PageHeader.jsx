import { cn } from '../../utils'

/**
 * PageHeader
 * @param {string} title
 * @param {string} subtitle
 * @param {React.ReactNode} actions - slot for CTA buttons, placed right
 * @param {React.ReactNode} breadcrumb - optional breadcrumb above title
 */
function PageHeader({ title, subtitle, actions, breadcrumb, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1">{breadcrumb}</div>}
        <h1 className="text-2xl font-bold text-neutral-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}

export default PageHeader
