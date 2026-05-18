// ─── DATE ──────────────────────────────────────────────────
/**
 * Format ISO date string to DD/MM/YYYY
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d)) return '—'
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format ISO datetime to DD/MM/YYYY HH:mm
 */
export function formatDateTime(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d)) return '—'
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${formatDate(d)} ${time}`
}

/**
 * Returns relative time string: "2 giờ trước", "3 ngày trước"
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  const now  = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60)     return 'Vừa xong'
  if (diff < 3600)   return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400)  return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`
  return formatDate(date)
}

// ─── STRING ────────────────────────────────────────────────
/**
 * Get initials from full name: "Nguyen Van A" → "NA"
 */
export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str = '', max = 60) {
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── CLASSNAMES ───────────────────────────────────────────
/**
 * Simple className combiner — use instead of clsx if not installed
 * @param {...(string|null|undefined|false)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ─── ERROR ────────────────────────────────────────────────
/**
 * Extract error message from Axios error or plain Error
 */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Đã xảy ra lỗi, vui lòng thử lại.'
  )
}

// ─── NUMBER ───────────────────────────────────────────────
/**
 * Format number: 1234 → "1,234"
 */
export function formatNumber(num) {
  if (num == null) return '0'
  return new Intl.NumberFormat('vi-VN').format(num)
}
