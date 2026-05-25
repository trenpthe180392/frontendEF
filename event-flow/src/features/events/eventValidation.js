import { BUSINESS_TIME_ZONE } from '../../utils/dateFormat'

export function validateEventForm(form, now = new Date()) {
  const errors = {}
  const start = normalizeWallTime(form.startTime)
  const end = normalizeWallTime(form.endTime)
  const registrationStart = normalizeWallTime(form.registrationStart)
  const registrationDeadline = normalizeWallTime(form.registrationDeadline)
  const businessNow = toBusinessWallTime(now)

  if (!form.name.trim()) errors.name = 'Vui lòng nhập tên sự kiện.'
  if (!form.eventType) errors.eventType = 'Vui lòng chọn loại sự kiện.'
  if (!form.startTime) errors.startTime = 'Vui lòng chọn thời gian bắt đầu.'
  if (!form.endTime) errors.endTime = 'Vui lòng chọn thời gian kết thúc.'

  if (start && start <= businessNow) {
    errors.startTime = 'Thời gian bắt đầu phải ở tương lai.'
  }
  if (end && start && end <= start) {
    errors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu.'
  }
  if (registrationDeadline && registrationDeadline <= businessNow) {
    errors.registrationDeadline = 'Hạn đăng ký đã qua. Vui lòng chọn thời gian trong tương lai.'
  }
  if (registrationDeadline && start && registrationDeadline >= start) {
    errors.registrationDeadline = 'Hạn đăng ký phải trước thời gian bắt đầu sự kiện.'
  }
  if (registrationStart && registrationDeadline && registrationStart >= registrationDeadline) {
    errors.registrationStart = 'Thời gian mở đăng ký phải trước hạn đăng ký.'
    errors.registrationDeadline = 'Hạn đăng ký phải sau thời gian mở đăng ký.'
  }
  if (form.capacity && Number(form.capacity) < 1) errors.capacity = 'Sức chứa tối thiểu là 1.'
  if (form.estimatedBudget && Number(form.estimatedBudget) < 0) {
    errors.estimatedBudget = 'Ngân sách không được âm.'
  }

  return errors
}

function normalizeWallTime(value) {
  if (!value) return null
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(String(value))
  return match?.[1] || null
}

function toBusinessWallTime(now) {
  const parts = new globalThis.Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`
}
