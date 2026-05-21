import Button from '../ui/Button'

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} props.description
 * @param {boolean} props.loading
 * @param {Function} props.onClose
 * @param {Function} props.onConfirm
 */
function ConfirmDialog({
  open = false,
  title,
  description,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null

  function handleConfirm() {
    onConfirm?.()
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-neutral-300 bg-white p-4 shadow-lg" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="mt-2 text-sm text-neutral-500">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} loading={loading}>
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
