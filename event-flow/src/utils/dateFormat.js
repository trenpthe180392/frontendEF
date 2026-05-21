export function formatDateTime(value) {
  if (!value) return 'Chưa có'

  return new globalThis.Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatCurrency(value, currency = 'VND') {
  if (value === null || value === undefined || value === '') return 'Chưa có'

  const amount = Number(value)
  if (Number.isNaN(amount)) return String(value)

  return new globalThis.Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount)
}
