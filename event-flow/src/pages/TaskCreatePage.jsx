import { useEffect, useState } from 'react'
import { ArrowLeft, ClipboardList, Plus, Sparkles, TriangleAlert, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { aiApi, taskApi, teamApi, teamMemberApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { taskPriorityOptions, taskStatusOptions, toApiDateTime, toDateTimeLocalValue } from '../features/events/eventPageUtils'
import { canCreateTaskForEvent, getTaskCreationBlockedMessage, validateTaskDueTime } from '../features/events/taskCreationRules'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { normalizeTeamMember } from '../features/teams/teamPageUtils'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

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
  const [currentTeam, setCurrentTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(teamId ? { ...emptyTaskForm, teamId: String(teamId) } : emptyTaskForm)
  const [drafts, setDrafts] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)

  const backPath = teamId
    ? `/organizations/${organizationId}/events/${eventId}/teams/${teamId}/tasks`
    : `/organizations/${organizationId}/events/${eventId}/tasks`
  const canCreate = canCreateTaskForEvent(eventDetail)
  const blockedMessage = getTaskCreationBlockedMessage(eventDetail)

  useEffect(() => {
    async function loadData() {
      try {
        if (teamId) {
          const [membersResponse, teamResponse] = await Promise.all([
            teamMemberApi.getByTeam(teamId),
            teamApi.getById(teamId),
          ])
          setMembers((membersResponse.data || []).map(normalizeTeamMember))
          setCurrentTeam(teamResponse.data || null)
          return
        }

        const teamsResponse = await teamApi.getByEvent(eventId)
        setTeams(teamsResponse.data || [])
        setCurrentTeam(null)
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

  function validateForm(formValue = form) {
    const nextErrors = {}
    if (!canCreate) nextErrors.event = blockedMessage
    if (!formValue.title.trim()) nextErrors.title = 'Vui lòng nhập công việc'
    if (!formValue.dueTime) nextErrors.dueTime = 'Vui lòng chọn hạn hoàn thành'
    if (formValue.dueTime) {
      const dueTimeError = validateTaskDueTime(eventDetail, formValue.dueTime)
      if (dueTimeError) nextErrors.dueTime = dueTimeError
    }
    if (formValue.progress && (Number(formValue.progress) < 0 || Number(formValue.progress) > 100)) {
      nextErrors.progress = 'Tiến độ từ 0 đến 100'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateDrafts() {
    if (!canCreate) {
      setErrors({ batch: blockedMessage })
      return false
    }

    const hasInvalidDraft = drafts.some((draft) => {
      return (
        !draft.title.trim() ||
        !draft.dueTime ||
        validateTaskDueTime(eventDetail, draft.dueTime) ||
        Number(draft.progress || 0) < 0 ||
        Number(draft.progress || 0) > 100
      )
    })
    if (drafts.length === 0 || hasInvalidDraft) {
      setErrors({ batch: 'Mỗi công việc cần có tên, hạn hoàn thành hợp lệ và tiến độ từ 0 đến 100.' })
      return false
    }
    setErrors({})
    return true
  }

  function buildTaskPayload(formValue) {
    return {
      title: formValue.title.trim(),
      description: formValue.description,
      priority: formValue.priority,
      status: formValue.status,
      dueTime: toApiDateTime(formValue.dueTime),
      eventId,
      teamId: formValue.teamId ? Number(formValue.teamId) : null,
      assigneeId: formValue.assigneeId ? Number(formValue.assigneeId) : null,
      progress: formValue.progress ? Number(formValue.progress) : 0,
    }
  }

  function normalizeSuggestionStatus(status) {
    if (taskStatusOptions.includes(status)) return status
    if (status === 'PENDING') return 'TODO'
    return 'TODO'
  }

  function normalizeSuggestionPriority(priority) {
    return taskPriorityOptions.includes(priority) ? priority : 'MEDIUM'
  }

  function findTeamBySuggestionName(teamName) {
    if (!teamName) return null
    const normalizedName = teamName.trim().toLowerCase()
    return teams.find((team) => String(team.name || '').trim().toLowerCase() === normalizedName) || null
  }

  function getDraftTeamName(taskForm) {
    if (teamId) return currentTeam?.name || 'Đội nhóm hiện tại'
    const team = teams.find((item) => Number(item.id) === Number(taskForm.teamId))
    return team?.name || 'Chưa gán đội nhóm'
  }

  function getDraftAssigneeName(taskForm) {
    const member = members.find((item) => Number(item.userId) === Number(taskForm.assigneeId))
    return member?.userName || 'Chưa gán thành viên'
  }

  function handleAddCurrentTaskToDrafts(event) {
    event.preventDefault()
    if (!validateForm()) return

    setDrafts((current) => [
      ...current,
      {
        ...form,
        id: `${Date.now()}-${current.length}`,
        teamName: getDraftTeamName(form),
        assigneeName: getDraftAssigneeName(form),
      },
    ])
    setForm(teamId ? { ...emptyTaskForm, teamId: String(teamId) } : emptyTaskForm)
    if (!teamId) setMembers([])
    setErrors({})
  }

  async function handleSuggestTask() {
    if (!canCreate) {
      onError(blockedMessage)
      return
    }

    setIsSuggesting(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await aiApi.suggestTasks(eventId)
      const suggestions = response.data?.tasks || []
      const scopedSuggestions = teamId
        ? suggestions.filter((task) => {
            if (!task.assignedTeam) return false
            return currentTeam?.name && task.assignedTeam.trim().toLowerCase() === currentTeam.name.trim().toLowerCase()
          })
        : suggestions

      if (scopedSuggestions.length === 0) {
        onSuccess(teamId ? 'AI chưa trả về công việc gợi ý cho đội nhóm này' : 'AI chưa trả về công việc gợi ý')
        return
      }

      const suggestionDrafts = scopedSuggestions.map((suggestion, index) => {
        const suggestedTeam = teamId ? currentTeam : findTeamBySuggestionName(suggestion.assignedTeam)
        const nextTeamId = teamId ? String(teamId) : suggestedTeam?.id ? String(suggestedTeam.id) : ''
        return {
          id: `ai-${Date.now()}-${index}`,
          title: suggestion.title?.trim() || `Công việc AI ${index + 1}`,
          description: suggestion.description || '',
          priority: normalizeSuggestionPriority(suggestion.priority),
          status: normalizeSuggestionStatus(suggestion.status),
          dueTime: toDateTimeLocalValue(suggestion.dueTime),
          teamId: nextTeamId,
          assigneeId: '',
          progress: suggestion.progress != null ? String(suggestion.progress) : '0',
          teamName: suggestedTeam?.name || suggestion.assignedTeam || 'Chưa gán đội nhóm',
          assigneeName: 'Chưa gán thành viên',
          source: 'AI',
        }
      })
      setDrafts((current) => [...current, ...suggestionDrafts])
      setErrors({})
      onSuccess(`AI đã gợi ý ${suggestionDrafts.length} công việc. Kiểm tra danh sách rồi lưu để tạo.`)
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
      await Promise.all(drafts.map((draft) => taskApi.create(buildTaskPayload(draft))))
      onSuccess(`Đã tạo ${drafts.length} công việc`)
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
        <form className="space-y-4" onSubmit={handleAddCurrentTaskToDrafts}>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" loading={isSuggesting} disabled={!canCreate} leftIcon={<Sparkles size={16} />} onClick={handleSuggestTask}>
              Gợi ý AI
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!canCreate} leftIcon={<Plus size={16} />}>
              Thêm công việc
            </Button>
          </div>
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
          {errors.batch ? <p className="text-sm font-medium text-danger">{errors.batch}</p> : null}
          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase text-neutral-900">Danh sách sẽ tạo</h3>
                <p className="mt-1 text-sm text-neutral-500">Các công việc trong hàng đợi sẽ được lưu cùng lúc.</p>
              </div>
              <Badge variant={drafts.length > 0 ? 'info' : 'default'}>{drafts.length} công việc</Badge>
            </div>
            {drafts.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
                Chưa có công việc nháp. Nhập công việc rồi bấm Thêm công việc hoặc dùng Gợi ý AI.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {drafts.map((draft, index) => (
                  <div key={draft.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-900">{index + 1}. {draft.title}</p>
                        {draft.source === 'AI' ? <Badge variant="info">AI</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs font-medium text-neutral-500">
                        {draft.priority} - {draft.status} - {formatDateTime(draft.dueTime)} - {draft.teamName} - {draft.assigneeName}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" leftIcon={<X size={16} />} onClick={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}>
                      Bỏ
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(backPath)}>
              Hủy
            </Button>
            <Button type="button" loading={isSubmitting} disabled={!canCreate || drafts.length === 0} leftIcon={<Plus size={16} />} onClick={handleCreateDrafts}>
              Lưu ({drafts.length})
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
