export const BUSINESS_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function formatDateTime(value) {
  if (!value) return 'Chưa có'

  const localDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(String(value))
  const date = localDateTime
    ? new Date(`${localDateTime[1]}-${localDateTime[2]}-${localDateTime[3]}T${localDateTime[4]}:${localDateTime[5]}:00Z`)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new globalThis.Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: localDateTime ? 'UTC' : BUSINESS_TIME_ZONE,
  }).format(date)
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
