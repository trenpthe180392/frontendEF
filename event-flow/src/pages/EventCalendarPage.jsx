import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Eye, Link as LinkIcon, Plus } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { calendarApi } from '../api'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import CalendarItemManager from '../features/calendar/CalendarItemManager'
import {
  addCalendarMonths,
  buildCalendarMonthDays,
  calendarStatusLabels,
  getCalendarAccent,
  getCalendarItemsForDay,
  getCalendarMonthTitle,
  isSameDate,
  toDateKey,
  weekdayLabels,
} from '../features/calendar/calendarUtils'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

function EventCalendarContent({ eventId, organizationId, reloadKey, onError, onSuccess }) {
  const navigate = useNavigate()
  const [calendars, setCalendars] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [monthAnchor, setMonthAnchor] = useState(() => new Date())
  const [selectedCalendar, setSelectedCalendar] = useState(null)

  const monthDays = useMemo(() => buildCalendarMonthDays(monthAnchor), [monthAnchor])
  const selectedItems = selectedDate ? getCalendarItemsForDay(calendars, selectedDate) : []
  const monthTitle = getCalendarMonthTitle(monthAnchor)

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
  }, [eventId, reloadKey])

  useEffect(() => {
    if (monthDays.length === 0) return
    const firstBusyDay = monthDays.find((day) => getCalendarItemsForDay(calendars, day.date).length > 0)
    setSelectedDate((current) => {
      if (current && monthDays.some((day) => isSameDate(day.date, current))) return current
      return firstBusyDay?.date || monthDays[0].date
    })
  }, [calendars, monthDays])

  function openCreatePage(date = selectedDate || new Date()) {
    navigate(`/organizations/${organizationId}/events/${eventId}/calendar/create`, {
      state: { defaultDate: toDateKey(date) },
    })
  }

  async function handleCalendarChanged(updatedCalendar) {
    setSelectedCalendar(updatedCalendar)
    await loadCalendars()
  }

  async function handleCalendarDeleted() {
    setSelectedCalendar(null)
    await loadCalendars()
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Lịch sự kiện"
        description="Theo dõi lịch trình trong đúng khoảng thời gian bắt đầu đến kết thúc của sự kiện."
        icon={<CalendarDays size={24} />}
        actions={
          <Button type="button" size="sm" leftIcon={<Plus size={16} />} onClick={() => openCreatePage()}>
            Tạo lịch
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <Card
          title="Lịch theo tháng"
          headerRight={
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" leftIcon={<ChevronLeft size={16} />} onClick={() => setMonthAnchor((current) => addCalendarMonths(current, -1))}>
                Trước
              </Button>
              <span className="min-w-32 text-center text-sm font-bold text-neutral-900">{monthTitle}</span>
              <Button type="button" variant="secondary" size="sm" leftIcon={<ChevronRight size={16} />} onClick={() => setMonthAnchor((current) => addCalendarMonths(current, 1))}>
                Sau
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-7 border border-neutral-200 text-sm">
            {weekdayLabels.map((label) => (
              <div key={label} className="border-b border-neutral-200 bg-neutral-50 px-2 py-2 text-center text-xs font-semibold text-neutral-500">
                {label}
              </div>
            ))}
            {monthDays.map((day, index) => {
              const dayItems = getCalendarItemsForDay(calendars, day.date)
              const firstAccent = getCalendarAccent(dayItems[0])
              const selected = selectedDate && isSameDate(selectedDate, day.date)
              return (
                <button
                  key={day.key}
                  type="button"
                  className={[
                    'min-h-[132px] border-b border-r border-neutral-200 p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary',
                    selected ? 'border-primary bg-primary/10' : dayItems.length > 0 ? firstAccent.day : 'bg-white hover:bg-neutral-50',
                  ].join(' ')}
                  style={{ gridColumnStart: index === 0 ? ((day.date.getDay() + 6) % 7) + 1 : undefined }} /* Required for calendar grid alignment */
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-neutral-900">{day.date.getDate()}</p>
                    {dayItems.length > 0 ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-neutral-700 shadow-sm">{dayItems.length}</span>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {dayItems.slice(0, 3).map((item) => {
                      const accent = getCalendarAccent(item)
                      return (
                        <div key={item.id} className={`truncate rounded-md border px-2 py-1 text-xs font-semibold ${accent.chip}`}>
                          {item.title}
                        </div>
                      )
                    })}
                    {dayItems.length > 3 ? <p className="text-xs font-semibold text-neutral-500">+{dayItems.length - 3} lịch khác</p> : null}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card
            title={selectedDate ? selectedDate.toLocaleDateString('vi-VN') : 'Thông tin ngày'}
            headerRight={
              <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={16} />} onClick={() => openCreatePage()}>
                Thêm
              </Button>
            }
          >
            {selectedItems.length === 0 ? (
              <EmptyState icon={<CalendarDays size={24} />} title="Ngày này chưa có lịch" description="Chọn ngày khác hoặc tạo lịch cho ngày đang xem." />
            ) : (
              <div className="space-y-3">
                {selectedItems.map((item) => {
                  const accent = getCalendarAccent(item)
                  return (
                    <article key={item.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                      <div className={`h-1.5 ${accent.bar}`} />
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-neutral-900">{item.title}</p>
                            <p className="mt-1 text-xs font-medium text-neutral-500">{item.type || 'EVENT'}</p>
                          </div>
                          <Badge variant="default">{calendarStatusLabels[item.status] || item.status || 'SCHEDULED'}</Badge>
                        </div>
                        <p className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                          <Clock size={15} />
                          {formatDateTime(item.startTime)} - {formatDateTime(item.endTime)}
                        </p>
                        {item.meetingUrl ? (
                          <a className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary" href={item.meetingUrl} target="_blank" rel="noreferrer">
                            <LinkIcon size={15} />
                            Meeting URL
                          </a>
                        ) : null}
                        {item.description ? <p className="mt-3 text-sm leading-6 text-neutral-600">{item.description}</p> : null}
                        <div className="mt-3 flex justify-end">
                          <Button type="button" variant="secondary" size="sm" leftIcon={<Eye size={16} />} onClick={() => setSelectedCalendar(item)}>
                            Xem/Sửa
                          </Button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Chi tiết lịch">
            <CalendarItemManager
              context="event"
              eventId={eventId}
              selectedItem={selectedCalendar}
              onChanged={handleCalendarChanged}
              onDeleted={handleCalendarDeleted}
              onSuccess={onSuccess}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

function EventCalendarPage() {
  const { eventId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    if (!location.state?.successMessage) return
    setSuccessMessage(location.state.successMessage)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ organizationId }) => (
        <EventCalendarContent
          eventId={Number(eventId)}
          organizationId={organizationId}
          reloadKey={location.state?.reloadAt}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default EventCalendarPage
