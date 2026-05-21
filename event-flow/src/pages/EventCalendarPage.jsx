import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { calendarApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { toApiDateTime } from '../features/events/eventPageUtils'
import { statusVariant } from '../features/organizations/organizationConstants'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const emptyCalendarForm = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  meetingUrl: '',
  type: 'EVENT',
  status: 'SCHEDULED',
  allDay: false,
}

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function EventCalendarContent({ eventId, onError, onSuccess }) {
  const [calendars, setCalendars] = useState([])
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [calendarForm, setCalendarForm] = useState(emptyCalendarForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  async function loadCalendars() {
    onError(null)
    try {
      const response = await calendarApi.getByEvent(eventId)
      setCalendars(response.data || [])
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadCalendars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth])

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setCalendarForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!calendarForm.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề'
    if (!calendarForm.startTime) nextErrors.startTime = 'Vui lòng chọn thời gian bắt đầu'
    if (!calendarForm.endTime) nextErrors.endTime = 'Vui lòng chọn thời gian kết thúc'
    if (calendarForm.startTime && calendarForm.endTime && new Date(calendarForm.endTime) <= new Date(calendarForm.startTime)) {
      nextErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      await calendarApi.createForEvent(eventId, {
        ...calendarForm,
        eventId,
        startTime: toApiDateTime(calendarForm.startTime),
        endTime: toApiDateTime(calendarForm.endTime),
      })
      setCalendarForm(emptyCalendarForm)
      setIsFormOpen(false)
      await loadCalendars()
      onSuccess('Đã tạo lịch sự kiện')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const monthTitle = new globalThis.Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(currentMonth)

  function openCreateForm(date = new Date()) {
    setCalendarForm({
      ...emptyCalendarForm,
      startTime: toLocalDateTimeInput(date, 9, 0),
      endTime: toLocalDateTimeInput(date, 10, 0),
    })
    setErrors({})
    setIsFormOpen(true)
    onError(null)
    onSuccess(null)
  }

  function closeCreateForm() {
    setCalendarForm(emptyCalendarForm)
    setErrors({})
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Lịch sự kiện"
        description="Quản lý agenda, lịch họp và các mốc vận hành theo tháng."
        icon={<CalendarDays size={24} />}
        actions={
          <>
            <Button
              variant={isFormOpen ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={isFormOpen ? <X size={16} /> : <Plus size={16} />}
              onClick={isFormOpen ? closeCreateForm : () => openCreateForm(new Date())}
            >
              {isFormOpen ? 'Đóng form' : 'Tạo lịch'}
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<ChevronLeft size={16} />} onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
              Trước
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<ChevronRight size={16} />} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              Sau
            </Button>
          </>
        }
        stats={[
          { label: 'Tháng', value: monthTitle },
          { label: 'Lịch', value: calendars.length },
        ]}
      />

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
      <Card
        title={monthTitle}
      >
        <div className="grid grid-cols-7 border border-neutral-200 text-sm">
          {weekdayLabels.map((label) => (
            <div key={label} className="border-b border-neutral-200 bg-neutral-50 px-2 py-2 text-center text-xs font-semibold text-neutral-500">
              {label}
            </div>
          ))}
          {monthDays.map((day) => {
            const dayItems = calendars.filter((item) => isSameDay(item.startTime, day.date))
            return (
              <button
                key={day.key}
                type="button"
                className="min-h-[120px] border-b border-r border-neutral-200 p-2 text-left transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => openCreateForm(day.date)}
              >
                <p className={day.inMonth ? 'text-sm font-semibold text-neutral-900' : 'text-sm text-neutral-400'}>{day.date.getDate()}</p>
                <div className="mt-2 space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="truncate rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 3 && <p className="text-xs text-neutral-500">+{dayItems.length - 3} lịch</p>}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="space-y-4">
        {isFormOpen ? (
          <Card
            title="Tạo lịch"
            headerRight={
              <Button type="button" variant="ghost" size="sm" leftIcon={<X size={16} />} onClick={closeCreateForm}>
                Đóng
              </Button>
            }
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormField label="Tiêu đề" required error={errors.title}>
                <Input name="title" value={calendarForm.title} onChange={handleChange} error={errors.title} placeholder="Họp BTC" />
              </FormField>
              <div className="grid grid-cols-1 gap-3">
                <FormField label="Bắt đầu" required error={errors.startTime}>
                  <Input name="startTime" type="datetime-local" value={calendarForm.startTime} onChange={handleChange} error={errors.startTime} />
                </FormField>
                <FormField label="Kết thúc" required error={errors.endTime}>
                  <Input name="endTime" type="datetime-local" value={calendarForm.endTime} onChange={handleChange} error={errors.endTime} />
                </FormField>
              </div>
              <FormField label="Trạng thái">
                <Select name="status" value={calendarForm.status} onChange={handleChange}>
                  {['SCHEDULED', 'IN_PROGRESS', 'DONE', 'CANCELLED'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Meeting URL">
                <Input name="meetingUrl" value={calendarForm.meetingUrl} onChange={handleChange} placeholder="https://..." />
              </FormField>
              <FormField label="Mô tả">
                <Textarea name="description" value={calendarForm.description} onChange={handleChange} />
              </FormField>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={closeCreateForm} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button type="submit" loading={isSubmitting} leftIcon={<Plus size={16} />}>
                  Tạo lịch
                </Button>
              </div>
            </form>
          </Card>
        ) : null}

        <Card title="Agenda">
          {calendars.length === 0 ? (
            <EmptyState icon={<CalendarDays size={24} />} title="Chưa có lịch" description="Tạo lịch đầu tiên cho sự kiện này." />
          ) : (
            <div className="space-y-3">
              {calendars.map((calendar) => (
                <div key={calendar.id} className="rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-neutral-900">{calendar.title}</p>
                    <Badge variant={statusVariant[String(calendar.status || '').toLowerCase()] || 'default'}>
                      {calendar.status || 'SCHEDULED'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{formatDateTime(calendar.startTime)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
    </div>
  )
}

function buildMonthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const mondayIndex = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - mondayIndex)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      date,
      key: date.toISOString(),
      inMonth: date.getMonth() === month.getMonth(),
    }
  })
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function isSameDay(value, date) {
  if (!value) return false
  const other = new Date(value)
  return other.getFullYear() === date.getFullYear() && other.getMonth() === date.getMonth() && other.getDate() === date.getDate()
}

function toLocalDateTimeInput(date, hour, minute) {
  const selected = new Date(date)
  selected.setHours(hour, minute, 0, 0)
  const offsetDate = new Date(selected.getTime() - selected.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function EventCalendarPage() {
  const { eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => <EventCalendarContent eventId={Number(eventId)} onError={setError} onSuccess={setSuccessMessage} />}
    </EventCaseLayout>
  )
}

export default EventCalendarPage
