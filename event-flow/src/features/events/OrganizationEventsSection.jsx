import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { eventApi } from '../../api'
import { getErrorMessage } from '../../utils'
import { formatDateTime } from '../../utils/dateFormat'
import useAutoReload from '../../hooks/useAutoReload'
import { normalizeOrganizationEvent } from '../../utils/organizationMappers'
import { defaultEventForm } from './eventConstants'
import { createEventFormFromEvent, toEventPayload } from './eventMappers'
import EventsPanel from './EventsPanel'

function OrganizationEventsSection({ organizationId, onError, onSuccess, onCountChange }) {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [eventForm, setEventForm] = useState(defaultEventForm)
  const [eventErrors, setEventErrors] = useState({})
  const [isEventSubmitting, setIsEventSubmitting] = useState(false)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventActionId, setEventActionId] = useState(null)
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState(null)
  const [pendingCancelEvent, setPendingCancelEvent] = useState(null)

  useEffect(() => {
    handleReloadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  useAutoReload(handleReloadEvents)

  function handleEventChange(event) {
    const { name, type, checked, value } = event.target
    setEventForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setEventErrors((current) => ({ ...current, [name]: null }))
    onSuccess(null)
  }

  async function handleReloadEvents() {
    onError(null)

    try {
      const response = await eventApi.getByOrganization(organizationId)
      const normalizedEvents = (response.data || []).map(normalizeOrganizationEvent)
      setEvents(normalizedEvents)
      onCountChange?.(normalizedEvents.length)
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  function validateEventForm() {
    const nextErrors = {}

    if (!eventForm.name.trim()) nextErrors.name = 'Vui lòng nhập tên event'
    if (!eventForm.eventType) nextErrors.eventType = 'Vui lòng chọn loại event'
    if (!eventForm.startTime) nextErrors.startTime = 'Vui lòng chọn thời gian bắt đầu'
    if (!eventForm.endTime) nextErrors.endTime = 'Vui lòng chọn thời gian kết thúc'

    if (eventForm.startTime && eventForm.endTime && new Date(eventForm.endTime) <= new Date(eventForm.startTime)) {
      nextErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu'
    }

    if (
      eventForm.registrationStart &&
      eventForm.registrationDeadline &&
      new Date(eventForm.registrationDeadline) <= new Date(eventForm.registrationStart)
    ) {
      nextErrors.registrationDeadline = 'Hạn đăng ký phải sau thời gian mở đăng ký'
    }

    if (eventForm.capacity && Number(eventForm.capacity) < 1) nextErrors.capacity = 'Capacity tối thiểu là 1'
    if (eventForm.estimatedBudget && Number(eventForm.estimatedBudget) < 0) {
      nextErrors.estimatedBudget = 'Ngân sách không được âm'
    }

    setEventErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmitEvent(event) {
    event.preventDefault()
    if (!validateEventForm()) return

    setIsEventSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      const payload = toEventPayload(eventForm, organizationId)
      if (editingEvent) {
        await eventApi.update(editingEvent.eventId, payload)
      } else {
        await eventApi.create(payload)
      }

      await handleReloadEvents()
      setEventForm(defaultEventForm)
      setEventErrors({})
      setEditingEvent(null)
      setIsEventFormOpen(false)
      onSuccess(editingEvent ? 'Đã cập nhật event' : 'Đã tạo event')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsEventSubmitting(false)
    }
  }

  async function handleConfirmCancelEvent() {
    if (!pendingCancelEvent?.eventId) return

    setEventActionId(`cancel-${pendingCancelEvent.eventId}`)
    onError(null)
    onSuccess(null)

    try {
      await eventApi.cancel(pendingCancelEvent.eventId)
      setEvents((current) =>
        current.map((item) =>
          item.eventId === pendingCancelEvent.eventId ? { ...item, status: 'cancelled' } : item
        )
      )
      setPendingCancelEvent(null)
      onSuccess('Đã hủy event')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setEventActionId(null)
    }
  }

  async function handleConfirmDeleteEvent() {
    if (!pendingDeleteEvent?.eventId) return

    setEventActionId(`delete-${pendingDeleteEvent.eventId}`)
    onError(null)
    onSuccess(null)

    try {
      await eventApi.delete(pendingDeleteEvent.eventId)
      setEvents((current) => {
        const next = current.filter((item) => item.eventId !== pendingDeleteEvent.eventId)
        onCountChange?.(next.length)
        return next
      })
      if (editingEvent?.eventId === pendingDeleteEvent.eventId) {
        setEditingEvent(null)
        setEventForm(defaultEventForm)
        setEventErrors({})
        setIsEventFormOpen(false)
      }
      setPendingDeleteEvent(null)
      onSuccess('Đã xóa event')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setEventActionId(null)
    }
  }

  return (
    <EventsPanel
      events={events}
      eventForm={eventForm}
      eventErrors={eventErrors}
      editingEvent={editingEvent}
      isEventFormOpen={isEventFormOpen}
      isEventSubmitting={isEventSubmitting}
      eventActionId={eventActionId}
      pendingDeleteEvent={pendingDeleteEvent}
      pendingCancelEvent={pendingCancelEvent}
      onChange={handleEventChange}
      onSubmit={handleSubmitEvent}
      onCreate={() => navigate(`/organizations/${organizationId}/events/create`)}
      onToggleForm={() => {
        setIsEventFormOpen((current) => !current)
        setEditingEvent(null)
        setEventForm(defaultEventForm)
        setEventErrors({})
        onError(null)
        onSuccess(null)
      }}
      onEdit={(event) => {
        setEditingEvent(event)
        setEventForm(createEventFormFromEvent(event))
        setEventErrors({})
        setIsEventFormOpen(true)
        onError(null)
        onSuccess(null)
      }}
      onCancelEdit={() => {
        setEditingEvent(null)
        setEventForm(defaultEventForm)
        setEventErrors({})
        setIsEventFormOpen(false)
      }}
      onCancelEvent={setPendingCancelEvent}
      onDeleteEvent={setPendingDeleteEvent}
      onViewEvent={(event) => navigate(`/organizations/${organizationId}/events/${event.eventId}`)}
      onCloseDelete={() => setPendingDeleteEvent(null)}
      onConfirmDelete={handleConfirmDeleteEvent}
      onCloseCancel={() => setPendingCancelEvent(null)}
      onConfirmCancel={handleConfirmCancelEvent}
      formatDateTime={formatDateTime}
    />
  )
}

export default OrganizationEventsSection
