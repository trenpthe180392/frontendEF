import { useEffect, useState } from 'react'
import { ArrowLeft, ClipboardList, Save } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { taskApi, teamApi, teamMemberApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout from '../features/events/EventCaseLayout'
import {
  createTaskFormFromTask,
  taskPriorityOptions,
  taskStatusOptions,
  toApiDateTime,
} from '../features/events/eventPageUtils'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { normalizeTeamMember } from '../features/teams/teamPageUtils'
import { getErrorMessage } from '../utils'

const emptyTaskForm = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  dueTime: '',
  teamId: '',
  assigneeId: '',
  progress: '0',
}

function TaskEditContent({ eventDetail, eventId, teamId, taskId, backPath, onError, onSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyTaskForm)
  const [teams, setTeams] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [fixedTeamName, setFixedTeamName] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function loadTeamMembers(teamValue) {
    if (!teamValue) {
      setTeamMembers([])
      return []
    }

    try {
      const response = await teamMemberApi.getByTeam(Number(teamValue))
      const normalizedMembers = (response.data || []).map(normalizeTeamMember)
      setTeamMembers(normalizedMembers)
      return normalizedMembers
    } catch (err) {
      setTeamMembers([])
      onError(getErrorMessage(err))
      return []
    }
  }

  async function loadInitialData() {
    setIsLoading(true)
    onError(null)

    try {
      const taskResponse = await taskApi.getById(taskId)
      const task = taskResponse.data || {}
      const nextForm = createTaskFormFromTask(task)

      if (!teamId) {
        const teamsResponse = await teamApi.getByEvent(eventId)
        const eventTeams = teamsResponse.data || []
        setTeams(eventTeams)
        if (!nextForm.teamId) {
          nextForm.teamId = resolveTeamId(task, eventTeams)
        }
      } else {
        nextForm.teamId = String(teamId)
      }

      const members = await loadTeamMembers(nextForm.teamId)
      if (!nextForm.assigneeId) {
        nextForm.assigneeId = resolveAssigneeId(task, members)
      }

      setForm(nextForm)
      setFixedTeamName(task.teamName && task.teamName !== 'N/A' ? task.teamName : 'Đội nhóm hiện tại')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, eventId, teamId])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'teamId' ? { assigneeId: '' } : {}),
    }))
    setErrors((current) => ({ ...current, [name]: null }))
    if (name === 'teamId') loadTeamMembers(value)
  }

  function validateForm() {
    const nextErrors = {}
    if (!canEditTaskForEvent(eventDetail)) {
      nextErrors.event = getTaskEditBlockedMessage(eventDetail)
    }
    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập công việc'
    if (!form.dueTime) nextErrors.dueTime = 'Vui lòng chọn hạn hoàn thành'
    if (form.dueTime) {
      const dueTimeError = validateTaskDueTime(eventDetail, form.dueTime)
      if (dueTimeError) nextErrors.dueTime = dueTimeError
    }
    if (form.progress && (Number(form.progress) < 0 || Number(form.progress) > 100)) {
      nextErrors.progress = 'Tiến độ từ 0 đến 100'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildPayload() {
    return {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      status: form.status,
      dueTime: toApiDateTime(form.dueTime),
      eventId,
      teamId: form.teamId ? Number(form.teamId) : null,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      progress: form.progress ? Number(form.progress) : 0,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      await taskApi.update(taskId, buildPayload())
      onSuccess('Đã cập nhật công việc')
      navigate(backPath)
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
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Sửa công việc</h1>
              <p className="mt-1 text-sm leading-6 text-neutral-500">Cập nhật thông tin, đội nhóm, thành viên phụ trách và tiến độ công việc.</p>
            </div>
          </div>
          <Button type="button" variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(backPath)}>
            Quay lại danh sách
          </Button>
        </div>
      </section>

      <Card title="Thông tin công việc">
        {isLoading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errors.event ? (
              <div className="rounded-xl border border-warning/30 bg-warning-bg p-3 text-sm font-medium text-warning">{errors.event}</div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <SectionTitle title="Thông tin chính" description="Tên, mô tả và thời hạn của công việc." />
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <FormField label="Tên công việc" required error={errors.title}>
                      <Input name="title" value={form.title} onChange={handleChange} error={errors.title} placeholder="Chuẩn bị sân khấu" />
                    </FormField>
                  </div>
                  <FormField label="Hạn hoàn thành" required error={errors.dueTime}>
                    <Input name="dueTime" type="datetime-local" value={form.dueTime} onChange={handleChange} error={errors.dueTime} />
                  </FormField>
                  <FormField label="Mức ưu tiên">
                    <Select name="priority" value={form.priority} onChange={handleChange}>
                      {taskPriorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <div className="lg:col-span-2">
                    <FormField label="Mô tả">
                      <Textarea name="description" value={form.description} onChange={handleChange} rows={8} />
                    </FormField>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-4">
                <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <SectionTitle title="Phân công" description="Đổi đội nhóm trước, sau đó chọn người phụ trách." />
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <FormField label="Đội nhóm">
                      {teamId ? (
                        <Input value={fixedTeamName} disabled />
                      ) : (
                        <Select name="teamId" value={form.teamId} onChange={handleChange}>
                          <option value="">Chưa gán đội nhóm</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </FormField>
                    <FormField label="Thành viên phụ trách">
                      <Select name="assigneeId" value={form.assigneeId} onChange={handleChange} disabled={!form.teamId}>
                        <option value="">Chưa gán thành viên</option>
                        {teamMembers.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.userName}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <SectionTitle title="Theo dõi" description="Trạng thái hiện tại và phần trăm hoàn thành." />
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Trạng thái">
                      <Select name="status" value={form.status} onChange={handleChange}>
                        {taskStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Tiến độ" error={errors.progress}>
                      <Input name="progress" type="number" min="0" max="100" value={form.progress} onChange={handleChange} error={errors.progress} />
                    </FormField>
                  </div>
                </section>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate(backPath)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" loading={isSubmitting} leftIcon={<Save size={16} />}>
                Lưu công việc
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-neutral-900">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-neutral-500">{description}</p>
    </div>
  )
}

function TaskEditPage() {
  const { organizationId, eventId, teamId, taskId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const backPath = teamId
    ? `/organizations/${organizationId}/events/${eventId}/teams/${teamId}/tasks`
    : `/organizations/${organizationId}/events/${eventId}/tasks`

  if (teamId) {
    return (
      <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
        {({ eventDetail }) => (
          <TaskEditContent
            eventDetail={eventDetail}
            eventId={Number(eventId)}
            teamId={Number(teamId)}
            taskId={Number(taskId)}
            backPath={backPath}
            onError={setError}
            onSuccess={setSuccessMessage}
          />
        )}
      </TeamCaseLayout>
    )
  }

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ eventDetail }) => (
        <TaskEditContent
          eventDetail={eventDetail}
          eventId={Number(eventId)}
          taskId={Number(taskId)}
          backPath={backPath}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

function canEditTaskForEvent(eventDetail) {
  if (!eventDetail) return false
  if (eventDetail.status !== 'ongoing') return false

  const now = new Date()
  const start = eventDetail.startTime ? new Date(eventDetail.startTime) : null
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

function getTaskEditBlockedMessage(eventDetail) {
  if (!eventDetail) return 'Không xác định được thông tin sự kiện.'
  if (eventDetail.status !== 'ongoing') return 'Công việc chỉ được sửa khi sự kiện ở trạng thái Đang diễn ra.'

  const now = new Date()
  const start = eventDetail.startTime ? new Date(eventDetail.startTime) : null
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (start && now < start) return 'Chưa đến thời gian bắt đầu sự kiện.'
  if (end && now > end) return 'Sự kiện đã kết thúc.'
  return 'Công việc chỉ được sửa trong khoảng thời gian diễn ra sự kiện.'
}

function validateTaskDueTime(eventDetail, dueTimeValue) {
  const dueTime = new Date(dueTimeValue)
  if (Number.isNaN(dueTime.getTime())) return 'Hạn hoàn thành không hợp lệ'

  const now = new Date()
  if (dueTime < now) return 'Hạn hoàn thành không được trước thời điểm hiện tại'

  const start = eventDetail?.startTime ? new Date(eventDetail.startTime) : null
  const end = eventDetail?.endTime ? new Date(eventDetail.endTime) : null

  if (start && dueTime < start) return 'Hạn hoàn thành không được trước thời gian bắt đầu sự kiện'
  if (end && dueTime > end) return 'Hạn hoàn thành không được sau thời gian kết thúc sự kiện'
  return null
}

function resolveTeamId(task, teams) {
  const teamName = normalizeLookupText(task?.teamName || task?.assignedTeam || task?.team?.name)
  if (!teamName || teamName === 'n/a') return ''

  const matchedTeam = teams.find((team) => normalizeLookupText(team.name) === teamName)
  return matchedTeam?.id ? String(matchedTeam.id) : ''
}

function resolveAssigneeId(task, members) {
  const assigneeName = normalizeLookupText(task?.assigneeName || task?.assignedTo || task?.assignedToUserName)
  if (!assigneeName || assigneeName === 'n/a' || assigneeName === 'chưa gán' || assigneeName === 'chưa gán thành viên') return ''

  const matchedMember = members.find((member) => normalizeLookupText(member.userName) === assigneeName)
  return matchedMember?.userId ? String(matchedMember.userId) : ''
}

function normalizeLookupText(value) {
  return String(value || '').trim().toLowerCase()
}

export default TaskEditPage
