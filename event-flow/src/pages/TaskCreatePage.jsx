import { useEffect, useState } from 'react'
import { ArrowLeft, ClipboardList, Plus, TriangleAlert } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { taskApi, teamApi, teamMemberApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { taskPriorityOptions, taskStatusOptions, toApiDateTime } from '../features/events/eventPageUtils'
import { canCreateTaskForEvent, getTaskCreationBlockedMessage, validateTaskDueTime } from '../features/events/taskCreationRules'
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

function TaskCreateContent({ eventDetail, organizationId, eventId, teamId = null, onError, onSuccess }) {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(teamId ? { ...emptyTaskForm, teamId: String(teamId) } : emptyTaskForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const backPath = teamId
    ? `/organizations/${organizationId}/events/${eventId}/teams/${teamId}/tasks`
    : `/organizations/${organizationId}/events/${eventId}/tasks`
  const canCreate = canCreateTaskForEvent(eventDetail)
  const blockedMessage = getTaskCreationBlockedMessage(eventDetail)

  useEffect(() => {
    async function loadData() {
      try {
        if (teamId) {
          const membersResponse = await teamMemberApi.getByTeam(teamId)
          setMembers((membersResponse.data || []).map(normalizeTeamMember))
          return
        }

        const teamsResponse = await teamApi.getByEvent(eventId)
        setTeams(teamsResponse.data || [])
      } catch (err) {
        onError(getErrorMessage(err))
      }
    }

    loadData()
  }, [eventId, onError, teamId])

  async function loadTeamMembers(nextTeamId) {
    if (!nextTeamId) {
      setMembers([])
      return
    }

    try {
      const response = await teamMemberApi.getByTeam(Number(nextTeamId))
      setMembers((response.data || []).map(normalizeTeamMember))
    } catch (err) {
      setMembers([])
      onError(getErrorMessage(err))
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'teamId' ? { assigneeId: '' } : {}),
    }))
    setErrors((current) => ({ ...current, [name]: null }))
    onSuccess(null)
    if (name === 'teamId') loadTeamMembers(value)
  }

  function validateForm() {
    const nextErrors = {}
    if (!canCreate) nextErrors.event = blockedMessage
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

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      await taskApi.create({
        title: form.title.trim(),
        description: form.description,
        priority: form.priority,
        status: form.status,
        dueTime: toApiDateTime(form.dueTime),
        eventId,
        teamId: form.teamId ? Number(form.teamId) : null,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
        progress: form.progress ? Number(form.progress) : 0,
      })
      onSuccess('Đã tạo công việc')
      navigate(backPath)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Tạo công việc"
        description={teamId ? 'Tạo công việc trong phạm vi đội nhóm.' : 'Tạo công việc cấp sự kiện và có thể phân công cho đội nhóm hoặc thành viên.'}
        icon={<ClipboardList size={24} />}
        actions={
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(backPath)}>
            Danh sách công việc
          </Button>
        }
      />

      {!canCreate ? (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-bg p-4 text-sm text-warning">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Chưa thể tạo công việc</p>
            <p className="mt-1">{blockedMessage}</p>
          </div>
        </div>
      ) : null}

      <Card title="Thông tin công việc">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {errors.event ? <p className="text-sm font-medium text-danger">{errors.event}</p> : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormField label="Tên công việc" required error={errors.title}>
              <Input name="title" value={form.title} onChange={handleChange} error={errors.title} placeholder="Chuẩn bị sân khấu" />
            </FormField>
            {!teamId ? (
              <FormField label="Đội nhóm">
                <Select name="teamId" value={form.teamId} onChange={handleChange}>
                  <option value="">Chưa phân công đội nhóm</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            <FormField label="Thành viên phụ trách">
              <Select name="assigneeId" value={form.assigneeId} onChange={handleChange} disabled={!form.teamId}>
                <option value="">Chưa phân công thành viên</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.userName}
                  </option>
                ))}
              </Select>
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
            <FormField label="Trạng thái">
              <Select name="status" value={form.status} onChange={handleChange}>
                {taskStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Hạn hoàn thành" required error={errors.dueTime}>
              <Input name="dueTime" type="datetime-local" value={form.dueTime} onChange={handleChange} error={errors.dueTime} />
            </FormField>
            <FormField label="Tiến độ" error={errors.progress}>
              <Input name="progress" type="number" min="0" max="100" value={form.progress} onChange={handleChange} error={errors.progress} />
            </FormField>
            <FormField label="Mô tả">
              <Textarea name="description" value={form.description} onChange={handleChange} rows={4} />
            </FormField>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(backPath)}>
              Hủy
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!canCreate} leftIcon={<Plus size={16} />}>
              Tạo công việc
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function TaskCreatePage() {
  const { organizationId, eventId, teamId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  if (teamId) {
    return (
      <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
        {({ eventDetail }) => (
          <TaskCreateContent
            eventDetail={eventDetail}
            organizationId={Number(organizationId)}
            eventId={Number(eventId)}
            teamId={Number(teamId)}
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
        <TaskCreateContent
          eventDetail={eventDetail}
          organizationId={Number(organizationId)}
          eventId={Number(eventId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default TaskCreatePage
