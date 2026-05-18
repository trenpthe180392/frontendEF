import { cn } from '../../utils'

/**
 * FormField — label + input + error message wrapper
 * @param {string} label
 * @param {string} error
 * @param {boolean} required
 * @param {string} hint
 */
function FormField({ label, error, required = false, hint, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  )
}

export default FormField
