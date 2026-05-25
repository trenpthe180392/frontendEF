import React from 'react'

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {React.ReactNode} props.children
 * @param {Function} props.onClose
 * @param {React.ReactNode} props.footer
 */
function Modal({
  open = false,
  title,
  children,
  onClose,
  footer,
  size = 'md',
}) {
  if (!open) return null

  const maxWidthClass = {
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-lg'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4" onClick={onClose}>
      <div className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-lg ${maxWidthClass}`} onClick={(event) => event.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-300 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-900" aria-label="Đóng">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-6">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-neutral-300 bg-neutral-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
