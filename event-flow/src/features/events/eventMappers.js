import { defaultEventForm } from './eventConstants'

function toDateTimeLocalValue(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

export function createEventFormFromEvent(event) {
  if (!event) return defaultEventForm

  return {
    name: event.name || '',
    description: event.description || '',
    eventType: event.eventType || 'Conference',
    location: event.location || '',
    startTime: toDateTimeLocalValue(event.startTime),
    endTime: toDateTimeLocalValue(event.endTime),
    registrationStart: toDateTimeLocalValue(event.registrationStart),
    registrationDeadline: toDateTimeLocalValue(event.registrationDeadline),
    capacity: event.capacity ? String(event.capacity) : '',
    estimatedBudget: event.estimatedBudget ? String(event.estimatedBudget) : '',
    visible: event.visible !== false,
  }
}

export function toEventPayload(form, organizationId, creatorId = null) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    eventType: form.eventType,
    location: form.location.trim() || null,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    registrationStart: form.registrationStart || null,
    registrationDeadline: form.registrationDeadline || null,
    capacity: form.capacity ? Number(form.capacity) : null,
    estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : null,
    visible: form.visible !== false,
    organizationId,
    creatorId,
  }
}
