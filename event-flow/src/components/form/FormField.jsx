/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.error
 * @param {boolean} props.required
 * @param {import('react').ReactNode} props.children
 */
function FormField({ label, error = '', required = false, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase text-neutral-500">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {error && <span className="mt-2 block text-xs text-danger">{error}</span>}
    </label>
  )
}

export default FormField
