import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Link as LinkIcon, Plus } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { calendarApi } from '../api'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
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
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

function TeamCalendarContent({ organizationId, eventId, teamId, reloadKey, onError }) {
  const navigate = useNavigate()
  const [calendars, setCalendars] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [monthAnchor, setMonthAnchor] = useState(() => new Date())

  const monthDays = useMemo(() => buildCalendarMonthDays(monthAnchor), [monthAnchor])
  const selectedItems = selectedDate ? getCalendarItemsForDay(calendars, selectedDate) : []
  const monthTitle = getCalendarMonthTitle(monthAnchor)

  async function loadCalendars() {
    onError(null)
    try {
      const response = await calendarApi.getByTeam(teamId)
      setCalendars(response.data || [])
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadCalendars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, reloadKey])

  useEffect(() => {
    if (monthDays.length === 0) return
    const firstBusyDay = monthDays.find((day) => getCalendarItemsForDay(calendars, day.date).length > 0)
    setSelectedDate((current) => {
      if (current && monthDays.some((day) => isSameDate(day.date, current))) return current
      return firstBusyDay?.date || monthDays[0].date
    })
  }, [calendars, monthDays])

  function openCreatePage(date = selectedDate || new Date()) {
    navigate(`/organizations/${organizationId}/events/${eventId}/teams/${teamId}/calendar/create`, {
      state: { defaultDate: toDateKey(date) },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
      <Card
        title="Lịch đội nhóm theo tháng"
        headerRight={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<ChevronLeft size={16} />} onClick={() => setMonthAnchor((current) => addCalendarMonths(current, -1))}>
              Trước
            </Button>
            <span className="min-w-32 text-center text-sm font-bold text-neutral-900">{monthTitle}</span>
            <Button type="button" variant="secondary" size="sm" leftIcon={<ChevronRight size={16} />} onClick={() => setMonthAnchor((current) => addCalendarMonths(current, 1))}>
              Sau
            </Button>
            <Button type="button" size="sm" leftIcon={<Plus size={16} />} onClick={() => openCreatePage()}>
              Tạo lịch
            </Button>
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500">Tháng</p>
            <p className="mt-1 text-xl font-bold text-neutral-900">{monthTitle}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500">Lịch</p>
            <p className="mt-1 text-xl font-bold text-neutral-900">{calendars.length}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500">Đang xem</p>
            <p className="mt-1 text-xl font-bold text-neutral-900">{selectedItems.length}</p>
          </div>
        </div>

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
                style={{ gridColumnStart: index === 0 ? ((day.date.getDay() + 6) % 7) + 1 : undefined }}
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
                        <p className="mt-1 text-xs font-medium text-neutral-500">{item.type || 'TEAM'}</p>
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
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function TeamCalendarPage() {
  const { eventId, teamId } = useParams()
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
    <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ eventDetail, organizationId }) => (
        <TeamCalendarContent
          eventDetail={eventDetail}
          organizationId={organizationId}
          eventId={Number(eventId)}
          teamId={Number(teamId)}
          reloadKey={location.state?.reloadAt}
          onError={setError}
        />
      )}
    </TeamCaseLayout>
  )
}

export default TeamCalendarPage
