import { defaultEventForm } from './eventConstants'

function toDateTimeLocalValue(value) {
  if (!value) return ''

  const businessWallTime = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(String(value))
  if (businessWallTime && !/[zZ]|[+-]\d{2}:\d{2}$/.test(String(value))) {
    return businessWallTime[1]
  }

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
    capacity: event.capacity ? String(event.capacity) : '',
    estimatedBudget: event.estimatedBudget ? String(event.estimatedBudget) : '',
    visible: event.visible !== false,
    permissionScope: event.permissionScope || 'ORG',
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
    capacity: form.capacity ? Number(form.capacity) : null,
    estimatedBudget: form.estimatedBudget ? form.estimatedBudget.trim() : null,
    visible: form.visible !== false,
    permissionScope: form.permissionScope || 'ORG',
    organizationId,
    creatorId,
  }
}
