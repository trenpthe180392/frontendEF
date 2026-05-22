import { useState } from 'react'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { aiApi, calendarApi } from '../api'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import CalendarCreateForm from '../features/calendar/CalendarCreateForm'
import { toLocalDateTimeInput } from '../features/calendar/calendarUtils'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { toApiDateTime, toDateTimeLocalValue } from '../features/events/eventPageUtils'
import { getErrorMessage } from '../utils'

const emptyForm = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  meetingUrl: '',
  type: 'EVENT',
  status: 'SCHEDULED',
  allDay: false,
}

function EventCalendarCreateContent({ eventId, organizationId, defaultDate, onError, onSuccess }) {
  const navigate = useNavigate()
  const backPath = `/organizations/${organizationId}/events/${eventId}/calendar`
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    startTime: toLocalDateTimeInput(defaultDate || new Date(), 9, 0),
    endTime: toLocalDateTimeInput(defaultDate || new Date(), 10, 0),
  }))
  const [errors, setErrors] = useState({})
  const [drafts, setDrafts] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: null }))
    onSuccess(null)
  }

  function validateForm(formValue = form) {
    const nextErrors = {}
    if (!formValue.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề'
    if (!formValue.startTime) nextErrors.startTime = 'Vui lòng chọn thời gian bắt đầu'
    if (!formValue.endTime) nextErrors.endTime = 'Vui lòng chọn thời gian kết thúc'
    if (formValue.startTime && formValue.endTime && new Date(formValue.endTime) <= new Date(formValue.startTime)) {
      nextErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateDrafts() {
    const hasInvalidDraft = drafts.some((draft) => {
      return !draft.title.trim() || !draft.startTime || !draft.endTime || new Date(draft.endTime) <= new Date(draft.startTime)
    })
    if (drafts.length === 0 || hasInvalidDraft) {
      setErrors({ batch: 'Mỗi lịch cần có tiêu đề, thời gian bắt đầu và thời gian kết thúc hợp lệ.' })
      return false
    }
    setErrors({})
    return true
  }

  function buildCalendarPayload(formValue) {
    return {
      ...formValue,
      eventId,
      startTime: toApiDateTime(formValue.startTime),
      endTime: toApiDateTime(formValue.endTime),
    }
  }

  function handleAddCurrentCalendarToDrafts(event) {
    event.preventDefault()
    if (!validateForm()) return

    setDrafts((current) => [
      ...current,
      {
        ...form,
        id: `${Date.now()}-${current.length}`,
      },
    ])
    setForm({
      ...emptyForm,
      startTime: toLocalDateTimeInput(defaultDate || new Date(), 9, 0),
      endTime: toLocalDateTimeInput(defaultDate || new Date(), 10, 0),
    })
    setErrors({})
  }

  async function handleSuggestCalendar() {
    setIsSuggesting(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await aiApi.suggestCalendar(eventId)
      const suggestions = getCalendarSuggestions(response.data)

      if (suggestions.length === 0) {
        onSuccess('AI chưa trả về lịch gợi ý')
        return
      }

      const suggestionDrafts = suggestions.map((suggestion, index) => createDraftFromSuggestion(suggestion, 'EVENT', index))
      setDrafts((current) => [...current, ...suggestionDrafts])
      setErrors({})
      onSuccess(`AI đã gợi ý ${suggestionDrafts.length} lịch. Kiểm tra danh sách rồi lưu để tạo.`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSuggesting(false)
    }
  }

  async function handleCreateDrafts() {
    if (!validateDrafts()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      await Promise.all(drafts.map((draft) => calendarApi.createForEvent(eventId, buildCalendarPayload(draft))))
      navigate(backPath, { state: { successMessage: `Đã tạo ${drafts.length} lịch sự kiện`, reloadAt: Date.now() } })
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Tạo lịch sự kiện"
        description="Tạo một mốc lịch mới trong phạm vi thời gian diễn ra sự kiện."
        icon={<CalendarDays size={24} />}
        actions={
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(backPath)}>
            Quay lại lịch
          </Button>
        }
      />
      <Card title="Thông tin lịch">
        <CalendarCreateForm
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          isSuggesting={isSuggesting}
          drafts={drafts}
          onCancel={() => navigate(backPath)}
          onChange={handleChange}
          onSubmit={handleAddCurrentCalendarToDrafts}
          onSuggest={handleSuggestCalendar}
          onRemoveDraft={(draftId) => setDrafts((current) => current.filter((draft) => draft.id !== draftId))}
          onCreateDrafts={handleCreateDrafts}
        />
      </Card>
    </div>
  )
}

function EventCalendarCreatePage() {
  const { organizationId, eventId } = useParams()
  const location = useLocation()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <EventCalendarCreateContent
          eventId={Number(eventId)}
          organizationId={Number(organizationId)}
          defaultDate={location.state?.defaultDate}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

function getCalendarSuggestions(responseData) {
  const suggestions = responseData?.calendars || responseData?.calendar || responseData?.items || []
  if (!suggestions) return []
  return Array.isArray(suggestions) ? suggestions : [suggestions]
}

function createDraftFromSuggestion(suggestion, type, index) {
  return {
    id: `ai-${Date.now()}-${index}`,
    title: suggestion.title?.trim() || `Lịch AI ${index + 1}`,
    description: suggestion.description || suggestion.relatedTask || '',
    startTime: toDateTimeLocalValue(suggestion.startTime),
    endTime: toDateTimeLocalValue(suggestion.endTime),
    meetingUrl: suggestion.meetingOptions || '',
    type: suggestion.type || type,
    status: suggestion.status || 'SCHEDULED',
    allDay: Boolean(suggestion.allDay),
    source: 'AI',
  }
}

export default EventCalendarCreatePage
