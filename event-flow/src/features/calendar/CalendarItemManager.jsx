import { useEffect, useState } from 'react'
import { CalendarClock, Edit3, Link as LinkIcon, RefreshCw, Save, Trash2, X } from 'lucide-react'

import { calendarApi } from '../../api'
import { unwrapData } from '../../api/response'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import FormField from '../../components/form/FormField'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import Textarea from '../../components/ui/Textarea'
import { getErrorMessage, getFieldErrors } from '../../utils'
import { formatDateTime } from '../../utils/dateFormat'
import { toApiDateTime, toDateTimeLocalValue } from '../events/eventPageUtils'
import { calendarStatusLabels, calendarStatusOptions } from './calendarUtils'

const emptyCalendarForm = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  meetingUrl: '',
  type: 'EVENT',
  status: 'SCHEDULED',
  allDay: false,
  recurrenceRule: '',
}

function CalendarItemManager({
  context,
  eventId,
  teamId,
  selectedItem,
  onChanged,
  onDeleted,
  onSuccess,
}) {
  const [calendar, setCalendar] = useState(null)
  const [form, setForm] = useState(emptyCalendarForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function loadCalendarDetail(calendarId) {
    if (!calendarId) return

    setIsLoading(true)
    setError(null)
    setErrors({})

    try {
      const response =
        context === 'team'
          ? await calendarApi.getTeamCalendarDetail(teamId, calendarId)
          : await calendarApi.getEventCalendarDetail(eventId, calendarId)
      const detail = normalizeCalendar(unwrapData(response.data) || selectedItem)
      setCalendar(detail)
      setForm(createCalendarForm(detail, context))
      setIsEditing(false)
    } catch (err) {
      setCalendar(normalizeCalendar(selectedItem))
      setForm(createCalendarForm(selectedItem, context))
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setCalendar(null)
    setForm(emptyCalendarForm)
    setErrors({})
    setError(null)
    setIsEditing(false)
    loadCalendarDetail(selectedItem?.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id, context, eventId, teamId])

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: null }))
    setError(null)
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề lịch'
    if (!form.startTime) nextErrors.startTime = 'Vui lòng chọn thời gian bắt đầu'
    if (!form.endTime) nextErrors.endTime = 'Vui lòng chọn thời gian kết thúc'
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      nextErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu'
    }
    if (!calendarStatusOptions.includes(form.status)) nextErrors.status = 'Trạng thái lịch không hợp lệ'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildPayload() {
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      startTime: toApiDateTime(form.startTime),
      endTime: toApiDateTime(form.endTime),
      allDay: Boolean(form.allDay),
      type: form.type || (context === 'team' ? 'TEAM' : 'EVENT'),
      meetingUrl: form.meetingUrl.trim() || null,
      meetingOptions: form.meetingUrl.trim() || null,
      status: form.status,
      recurrenceRule: form.recurrenceRule.trim() || null,
      ...(context === 'team' ? { eventId, teamId } : { eventId }),
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!calendar?.id || !validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response =
        context === 'team'
          ? await calendarApi.updateForTeam(teamId, calendar.id, buildPayload())
          : await calendarApi.updateForEvent(eventId, calendar.id, buildPayload())
      const updatedCalendar = normalizeCalendar(unwrapData(response.data) || { ...calendar, ...buildPayload() })
      setCalendar(updatedCalendar)
      setForm(createCalendarForm(updatedCalendar, context))
      setIsEditing(false)
      await onChanged?.(updatedCalendar)
      onSuccess?.('Đã cập nhật lịch')
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!calendar?.id) return

    setIsDeleting(true)
    setError(null)

    try {
      if (context === 'team') {
        await calendarApi.deleteForTeam(teamId, calendar.id)
      } else {
        await calendarApi.deleteForEvent(eventId, calendar.id)
      }
      onSuccess?.('Đã xóa lịch')
      await onDeleted?.(calendar)
      setDeleteOpen(false)
      setCalendar(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  if (!selectedItem) {
    return (
      <EmptyState
        icon={<CalendarClock size={24} />}
        title="Chưa chọn lịch"
        description="Chọn một lịch trong ngày để xem chi tiết, chỉnh sửa hoặc xóa."
      />
    )
  }

  if (isLoading && !calendar) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Đang tải chi tiết lịch...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border border-info/20 bg-info-bg p-3 text-sm font-semibold text-info">
          <Spinner size="sm" />
          Đang làm mới chi tiết lịch...
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-danger/20 bg-danger-bg p-3 text-sm font-semibold text-danger">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{calendarStatusLabels[calendar?.status] || calendar?.status || 'SCHEDULED'}</Badge>
              <Badge variant="info">{calendar?.type || (context === 'team' ? 'TEAM' : 'EVENT')}</Badge>
            </div>
            <h3 className="mt-3 text-lg font-bold text-neutral-900">{calendar?.title || selectedItem.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">
              {formatDateTime(calendar?.startTime)} - {formatDateTime(calendar?.endTime)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              onClick={() => loadCalendarDetail(selectedItem.id)}
            >
              Tải lại
            </Button>
            <Button
              type="button"
              variant={isEditing ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={isEditing ? <X size={16} /> : <Edit3 size={16} />}
              onClick={() => {
                setIsEditing((current) => !current)
                setErrors({})
                setError(null)
                if (isEditing) setForm(createCalendarForm(calendar, context))
              }}
            >
              {isEditing ? 'Hủy sửa' : 'Sửa'}
            </Button>
            <Button type="button" variant="danger" size="sm" leftIcon={<Trash2 size={16} />} onClick={() => setDeleteOpen(true)}>
              Xóa
            </Button>
          </div>
        </div>
        {calendar?.description ? <p className="mt-3 text-sm leading-6 text-neutral-600">{calendar.description}</p> : null}
        {calendar?.meetingUrl || calendar?.meetingOptions ? (
          <a
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            href={calendar.meetingUrl || calendar.meetingOptions}
            target="_blank"
            rel="noreferrer"
          >
            <LinkIcon size={15} />
            Meeting URL
          </a>
        ) : null}
      </div>

      {isEditing ? (
        <form className="rounded-xl border border-neutral-200 bg-white p-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Tiêu đề" required error={errors.title}>
              <Input name="title" value={form.title} onChange={handleChange} error={errors.title} />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Bắt đầu" required error={errors.startTime}>
                <Input name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} error={errors.startTime} />
              </FormField>
              <FormField label="Kết thúc" required error={errors.endTime}>
                <Input name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} error={errors.endTime} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Trạng thái" error={errors.status}>
                <Select name="status" value={form.status} onChange={handleChange} error={errors.status}>
                  {calendarStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {calendarStatusLabels[status]} ({status})
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Loại lịch">
                <Input name="type" value={form.type} onChange={handleChange} />
              </FormField>
            </div>
            <FormField label="Meeting URL">
              <Input name="meetingUrl" value={form.meetingUrl} onChange={handleChange} placeholder="https://..." />
            </FormField>
            <FormField label="Recurrence rule">
              <Input name="recurrenceRule" value={form.recurrenceRule} onChange={handleChange} placeholder="RRULE nếu backend có trả về" />
            </FormField>
            <FormField label="Mô tả">
              <Textarea name="description" value={form.description} onChange={handleChange} rows={5} />
            </FormField>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-neutral-700">
              <input className="h-4 w-4 accent-primary" type="checkbox" name="allDay" checked={form.allDay} onChange={handleChange} />
              Cả ngày
            </label>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => {
                setIsEditing(false)
                setForm(createCalendarForm(calendar, context))
                setErrors({})
              }}
            >
              Hủy
            </Button>
            <Button type="submit" loading={isSubmitting} leftIcon={<Save size={16} />}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Xóa lịch?"
        description={`Xóa lịch ${calendar?.title || selectedItem.title || ''} khỏi ${context === 'team' ? 'đội nhóm' : 'sự kiện'} này?`}
        loading={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function createCalendarForm(calendar, context) {
  return {
    title: calendar?.title || '',
    description: calendar?.description || '',
    startTime: toDateTimeLocalValue(calendar?.startTime),
    endTime: toDateTimeLocalValue(calendar?.endTime),
    meetingUrl: calendar?.meetingUrl || calendar?.meetingOptions || '',
    type: calendar?.type || (context === 'team' ? 'TEAM' : 'EVENT'),
    status: calendar?.status || 'SCHEDULED',
    allDay: Boolean(calendar?.allDay),
    recurrenceRule: calendar?.recurrenceRule || '',
  }
}

function normalizeCalendar(calendar) {
  return {
    id: calendar?.id || calendar?.calendarId,
    title: calendar?.title || 'Lịch chưa có tiêu đề',
    description: calendar?.description || '',
    startTime: calendar?.startTime || null,
    endTime: calendar?.endTime || null,
    allDay: Boolean(calendar?.allDay),
    type: calendar?.type || '',
    meetingUrl: calendar?.meetingUrl || '',
    meetingOptions: calendar?.meetingOptions || '',
    status: calendar?.status || 'SCHEDULED',
    recurrenceRule: calendar?.recurrenceRule || '',
  }
}

export default CalendarItemManager
