import { useEffect, useState } from 'react'
import { ArrowLeft, MessageSquareText, Send, Star } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { feedbackApi, taskApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout from '../features/events/EventCaseLayout'
import { taskStatusOptions } from '../features/events/eventPageUtils'
import { statusVariant } from '../features/organizations/organizationConstants'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const emptyFeedbackForm = {
  title: '',
  content: '',
  rating: '5',
  visibility: 'PUBLIC',
  isAnonymous: false,
  newTaskStatus: 'DONE',
}

const visibilityOptions = [
  { value: 'PUBLIC', label: 'Công khai' },
  { value: 'ORG_ONLY', label: 'Trong tổ chức' },
  { value: 'PRIVATE', label: 'Riêng tư' },
]

function TaskFeedbackContent({ organizationId, eventId, teamId = null, taskId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [form, setForm] = useState(emptyFeedbackForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const detailPath = teamId
    ? `/organizations/${organizationId}/events/${eventId}/teams/${teamId}/tasks/${taskId}`
    : `/organizations/${organizationId}/events/${eventId}/tasks/${taskId}`

  useEffect(() => {
    async function loadTask() {
      setIsLoading(true)
      onError(null)
      try {
        const response = await taskApi.getById(taskId)
        const taskDetail = response.data
        setTask(taskDetail)
        setForm((current) => ({
          ...current,
          title: taskDetail?.title ? `Feedback: ${taskDetail.title}` : current.title,
          newTaskStatus: taskDetail?.status === 'DONE' ? 'DONE' : current.newTaskStatus,
        }))
      } catch (err) {
        onError(getErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadTask()
  }, [taskId, onError])

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: null }))
    onSuccess(null)
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề feedback'
    if (!form.content.trim()) nextErrors.content = 'Vui lòng nhập nội dung feedback'
    const rating = Number(form.rating)
    if (Number.isNaN(rating) || rating < 0 || rating > 5) nextErrors.rating = 'Điểm đánh giá từ 0 đến 5'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (task?.status !== 'DONE') {
      onError('Chỉ có thể gửi feedback khi công việc đã DONE')
      return
    }
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      await feedbackApi.createForTask({
        title: form.title.trim(),
        content: form.content.trim(),
        rating: Number(form.rating),
        visibility: form.visibility,
        isAnonymous: form.isAnonymous,
        taskId,
        eventId,
        newTaskStatus: form.newTaskStatus || null,
      })
      onSuccess('Đã gửi feedback cho công việc')
      navigate(detailPath)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <MessageSquareText size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-neutral-900">Gửi feedback công việc</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
                Ghi nhận đánh giá, nhận xét và cập nhật trạng thái sau khi xem xét công việc.
              </p>
            </div>
          </div>
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(detailPath)}>
            Quay lại công việc
          </Button>
        </div>
      </section>

      {isLoading && !task ? (
        <Card>
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Card>
      ) : task?.status !== 'DONE' ? (
        <Card>
          <EmptyState
            icon={<MessageSquareText size={24} />}
            title="Chưa thể gửi feedback"
            description="Feedback chỉ được gửi khi công việc đã hoàn thành."
          />
          <div className="mt-4 flex justify-center">
            <Button type="button" variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(detailPath)}>
              Quay lại công việc
            </Button>
          </div>
        </Card>
      ) : task ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
          <Card title="Công việc">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Tên công việc</p>
                <p className="mt-1 font-semibold text-neutral-900">{task.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant[String(task.status || '').toLowerCase()] || 'default'}>{task.status || 'TODO'}</Badge>
                <Badge variant="default">{task.priority || 'MEDIUM'}</Badge>
              </div>
              <Info label="Sự kiện" value={task.eventName || 'Chưa có'} />
              <Info label="Đội nhóm" value={task.teamName || 'Chưa có'} />
              <Info label="Người phụ trách" value={task.assignedTo || task.assigneeName || 'Chưa có'} />
              <Info label="Hạn hoàn thành" value={formatDateTime(task.dueTime)} />
              <Info label="Feedback hiện có" value={`${(task.feedback || []).length} feedback`} />
            </div>
          </Card>

          <Card title="Nội dung feedback">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormField label="Tiêu đề" required error={errors.title}>
                <Input name="title" value={form.title} onChange={handleChange} error={errors.title} />
              </FormField>
              <FormField label="Nội dung" required error={errors.content}>
                <Textarea name="content" value={form.content} onChange={handleChange} error={errors.content} rows={6} />
              </FormField>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField label="Điểm đánh giá" required error={errors.rating}>
                  <Input name="rating" type="number" min="0" max="5" step="0.5" value={form.rating} onChange={handleChange} error={errors.rating} />
                </FormField>
                <FormField label="Hiển thị">
                  <Select name="visibility" value={form.visibility} onChange={handleChange}>
                    {visibilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Trạng thái mới">
                  <Select name="newTaskStatus" value={form.newTaskStatus} onChange={handleChange}>
                    <option value="">Không đổi trạng thái</option>
                    {taskStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-neutral-700">
                <input className="h-4 w-4 accent-primary" type="checkbox" name="isAnonymous" checked={form.isAnonymous} onChange={handleChange} />
                Gửi ẩn danh
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <Star size={18} className="shrink-0" />
                Feedback sẽ được lưu vào công việc và có thể cập nhật trạng thái nếu bạn chọn trạng thái mới.
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => navigate(detailPath)} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button type="submit" loading={isSubmitting} leftIcon={<Send size={16} />}>
                  Gửi feedback
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-1 font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function TaskFeedbackPage() {
  const { organizationId, eventId, teamId, taskId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  if (teamId) {
    return (
      <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
        {() => (
          <TaskFeedbackContent
            organizationId={Number(organizationId)}
            eventId={Number(eventId)}
            teamId={Number(teamId)}
            taskId={Number(taskId)}
            onError={setError}
            onSuccess={setSuccessMessage}
          />
        )}
      </TeamCaseLayout>
    )
  }

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <TaskFeedbackContent
          organizationId={Number(organizationId)}
          eventId={Number(eventId)}
          taskId={Number(taskId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default TaskFeedbackPage
