export const calendarStatusOptions = ['SCHEDULED', 'IN_PROGRESS', 'DONE', 'CANCELLED']

export const calendarStatusLabels = {
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang diễn ra',
  DONE: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function getCalendarAccent(item = {}) {
  const status = String(item.status || 'SCHEDULED').toUpperCase()
  const type = String(item.type || '').toUpperCase()

  if (status === 'DONE') {
    return {
      chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      bar: 'bg-emerald-500',
      day: 'border-emerald-200 bg-emerald-50',
    }
  }
  if (status === 'IN_PROGRESS') {
    return {
      chip: 'border-amber-200 bg-amber-50 text-amber-700',
      bar: 'bg-amber-500',
      day: 'border-amber-200 bg-amber-50',
    }
  }
  if (status === 'CANCELLED') {
    return {
      chip: 'border-rose-200 bg-rose-50 text-rose-700',
      bar: 'bg-rose-500',
      day: 'border-rose-200 bg-rose-50',
    }
  }
  if (type === 'TEAM') {
    return {
      chip: 'border-cyan-200 bg-cyan-50 text-cyan-700',
      bar: 'bg-cyan-500',
      day: 'border-cyan-200 bg-cyan-50',
    }
  }
  return {
    chip: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    bar: 'bg-indigo-500',
    day: 'border-indigo-200 bg-indigo-50',
  }
}

export function buildCalendarMonthDays(anchorValue) {
  const anchor = normalizeDateOnly(anchorValue) || normalizeDateOnly(new Date())
  return buildMonthDays(anchor)
}

export function addCalendarMonths(anchorValue, amount) {
  const anchor = normalizeDateOnly(anchorValue) || normalizeDateOnly(new Date())
  return new Date(anchor.getFullYear(), anchor.getMonth() + amount, 1)
}

export function getCalendarMonthTitle(anchorValue) {
  const anchor = normalizeDateOnly(anchorValue) || normalizeDateOnly(new Date())
  return new globalThis.Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(anchor)
}

export function getCalendarItemsForDay(items, date) {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  return items.filter((item) => {
    const start = item.startTime ? new Date(item.startTime) : null
    const end = item.endTime ? new Date(item.endTime) : start
    if (!start || Number.isNaN(start.getTime())) return false
    const safeEnd = end && !Number.isNaN(end.getTime()) ? end : start
    return start <= dayEnd && safeEnd >= dayStart
  })
}

export function isSameDate(left, right) {
  if (!left || !right) return false
  return toDateKey(left) === toDateKey(right)
}

export function toDateKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toLocalDateTimeInput(date, hour = 9, minute = 0) {
  const selected = new Date(date)
  selected.setHours(hour, minute, 0, 0)
  const offsetDate = new Date(selected.getTime() - selected.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function buildMonthDays(anchorDate) {
  const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const last = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0)
  const days = []
  const cursor = new Date(first)
  while (cursor <= last) {
    days.push({
      date: new Date(cursor),
      key: toDateKey(cursor),
      inRange: true,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function normalizeDateOnly(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}
