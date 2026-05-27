import { useEffect, useState } from 'react'
import { ClipboardList, Eye, Pencil, Plus, Sparkles, Trash2, TriangleAlert, X } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { aiApi, taskApi, teamApi, teamMemberApi } from '../api'
import { normalizePageResponse } from '../api/response'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PaginationControls from '../components/ui/PaginationControls'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { taskPriorityOptions, taskStatusOptions, toApiDateTime, toDateTimeLocalValue } from '../features/events/eventPageUtils'
import { normalizeTeamMember } from '../features/teams/teamPageUtils'
import { statusVariant } from '../features/organizations/organizationConstants'
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

const DEFAULT_TASKS_PER_PAGE = 10
const financeRoleLabels = {
  BUDGET_MAJOR_TASK: { label: 'Task cha ngân sách', variant: 'success' },
  BUDGET_SUBTASK: { label: 'Task con chi phí', variant: 'info' },
  OPERATIONAL_TASK: { label: 'Công việc vận hành', variant: 'default' },
}

function normalizeTaskPage(responseData, pageSize = DEFAULT_TASKS_PER_PAGE) {
  if (Array.isArray(responseData)) {
    return {
      content: responseData,
      totalElements: responseData.length,
      totalPages: Math.max(1, Math.ceil(responseData.length / pageSize)),
      number: 0,
    }
  }
  const page = responseData?.page || {}
  return {
    content: responseData?.content || [],
    totalElements: responseData?.totalElements ?? page.totalElements ?? 0,
    totalPages: Math.max(1, responseData?.totalPages ?? page.totalPages ?? 1),
    number: responseData?.number ?? page.number ?? 0,
  }
}

function EventTasksContent({ eventDetail, organizationId, eventId, accessContext, onError, onSuccess }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [taskDrafts, setTaskDrafts] = useState([])
  const [aiContext, setAiContext] = useState('')
  const [pendingDeleteTask, setPendingDeleteTask] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TASKS_PER_PAGE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [actionId, setActionId] = useState(null)

  async function loadTasks() {
    onError(null)
    try {
      const taskParams = {
        page: currentPage - 1,
        size: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }
      const [tasksResponse, teamsResponse] = await Promise.all([taskApi.getByEvent(eventId, taskParams), teamApi.getByEvent(eventId)])
      const taskPage = normalizeTaskPage(tasksResponse.data, pageSize)
      setTasks(taskPage.content)
      setTotalElements(taskPage.totalElements)
      setTotalPages(taskPage.totalPages)
      setCurrentPage(taskPage.number + 1)
      setTeams(normalizePageResponse(teamsResponse.data, 100).items)
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  async function loadTeamMembers(teamId) {
    if (!teamId) {
      setTeamMembers([])
      return
    }

    try {
      const response = await teamMemberApi.getByTeam(Number(teamId))
      setTeamMembers(normalizePageResponse(response.data, 100).items.map(normalizeTeamMember))
    } catch (err) {
      setTeamMembers([])
      onError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, currentPage, pageSize, statusFilter])

  function handleChange(event) {
    const { name, value } = event.target
    setTaskForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'teamId' ? { assigneeId: '' } : {}),
    }))
    setErrors((current) => ({ ...current, [name]: null }))
    if (name === 'teamId') loadTeamMembers(value)
  }

  function validateTaskForm(formValue = taskForm) {
    const nextErrors = {}
    if (!canCreateTaskForEvent(eventDetail)) {
      nextErrors.event = getTaskCreationBlockedMessage(eventDetail)
    }
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
    if (!canCreateTaskForEvent(eventDetail)) {
      setErrors({ batch: getTaskCreationBlockedMessage(eventDetail) })
      return false
    }

    const hasInvalidDraft = taskDrafts.some((draft) => {
      return (
        !draft.title.trim() ||
        !draft.dueTime ||
        validateTaskDueTime(eventDetail, draft.dueTime) ||
        Number(draft.progress || 0) < 0 ||
        Number(draft.progress || 0) > 100
      )
    })
    if (taskDrafts.length === 0 || hasInvalidDraft) {
      setErrors({ batch: 'Mỗi dòng công việc cần có tên, hạn hoàn thành nằm trong thời gian diễn ra sự kiện và tiến độ từ 0 đến 100' })
      return false
    }
    setErrors({})
    return true
  }

  function buildTaskPayload(formValue) {
    return {
      title: formValue.title.trim(),
      description: formValue.description,
      taskType: formValue.taskType || null,
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

  function handleAddCurrentTaskToDrafts() {
    if (!validateTaskForm()) return

    const team = teams.find((item) => Number(item.id) === Number(taskForm.teamId))
    const member = teamMembers.find((item) => Number(item.userId) === Number(taskForm.assigneeId))

    setTaskDrafts((current) => [
      ...current,
      {
        ...taskForm,
        id: `${Date.now()}-${current.length}`,
        teamName: team?.name || 'Chưa gán đội nhóm',
        assigneeName: member?.userName || 'Chưa gán thành viên',
      },
    ])
    setTaskForm(emptyTaskForm)
    setTeamMembers([])
    setErrors({})
  }

  async function handleSuggestTasks() {
    if (!canCreateTaskForEvent(eventDetail)) {
      onError(getTaskCreationBlockedMessage(eventDetail))
      return
    }

    setIsFormOpen(true)
    setIsSuggesting(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await aiApi.suggestTasks(eventId, { additionalContext: aiContext.trim() })
      const suggestions = response.data?.tasks || []
      if (suggestions.length === 0) {
        onSuccess('AI chưa trả về công việc gợi ý')
        return
      }

      const suggestionDrafts = suggestions.map((task, index) => {
        const team = findTeamBySuggestionName(task.assignedTeam)
        const title = task.title?.trim() || `Task AI ${index + 1}`
        return {
          id: `ai-${Date.now()}-${index}`,
          title,
          description: task.description || '',
          taskType: task.taskType || null,
          priority: normalizeSuggestionPriority(task.priority),
          status: normalizeSuggestionStatus(task.status),
          dueTime: toDateTimeLocalValue(task.dueTime),
          teamId: team?.id ? String(team.id) : '',
          assigneeId: '',
          progress: task.progress != null ? String(task.progress) : '0',
          teamName: team?.name || task.assignedTeam || 'Chưa gán đội nhóm',
          assigneeName: 'Chưa gán thành viên',
          source: 'AI',
        }
      })

      setTaskDrafts((current) => [...current, ...suggestionDrafts])
      onSuccess(`AI đã gợi ý ${suggestionDrafts.length} công việc. Kiểm tra rồi lưu để tạo.`)
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
      await Promise.all(taskDrafts.map((draft) => taskApi.create(buildTaskPayload(draft))))
      setTaskDrafts([])
      setTaskForm(emptyTaskForm)
      setIsFormOpen(false)
      await loadTasks()
      onSuccess(`Đã tạo ${taskDrafts.length} công việc`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteTask?.id) return
    setActionId(`delete-${pendingDeleteTask.id}`)
    onError(null)
    onSuccess(null)

    try {
      await taskApi.delete(pendingDeleteTask.id)
      setPendingDeleteTask(null)
      await loadTasks()
      onSuccess('Đã xóa công việc')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  function closeForm() {
    setTaskForm(emptyTaskForm)
    setTaskDrafts([])
    setTeamMembers([])
    setErrors({})
    setIsFormOpen(false)
  }

  const filteredTasks = statusFilter === 'ALL' ? tasks : tasks.filter((task) => String(task.status || 'TODO') === statusFilter)
  const pagedTasks = filteredTasks
  const canManageTasks = canManageEventTasks(accessContext)
  const canCreateTask = canManageTasks && canCreateTaskForEvent(eventDetail)
  const taskBlockedMessage = getTaskCreationBlockedMessage(eventDetail)

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value)
    setCurrentPage(1)
  }

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  function getTaskTeamName(task) {
    if (task.teamName) return task.teamName
    const assignedTeam = task.assignedTeam || task.team?.name
    if (assignedTeam) return assignedTeam
    const matchedTeam = teams.find((team) => Number(team.id) === Number(task.teamId))
    return matchedTeam?.name || 'Chưa gán'
  }

  return (
    <>
      <EventWorkspaceHeader
        title="Công việc"
        description="Lập kế hoạch công việc, phân đội nhóm/thành viên và theo dõi tiến độ thực thi."
        icon={<ClipboardList size={24} />}
        actions={
          <Button
            type="button"
            variant={isFormOpen ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={isFormOpen ? <X size={16} /> : <Plus size={16} />}
            onClick={isFormOpen ? closeForm : () => navigate(`/organizations/${organizationId}/events/${eventId}/tasks/create`)}
            disabled={!canCreateTask && !isFormOpen}
          >
            {isFormOpen ? 'Đóng biểu mẫu' : 'Tạo công việc'}
          </Button>
        }
        stats={[
          { label: 'Công việc', value: totalElements },
          { label: 'Đang hiển thị', value: pagedTasks.length },
          { label: 'Trang', value: `${currentPage}/${totalPages}` },
          { label: 'Bộ lọc', value: statusFilter },
        ]}
      />
      <Card title="Phạm vi công việc và tài chính">
        <p className="text-sm leading-6 text-neutral-600">
          Gợi ý AI trong trang Công việc tạo <strong>công việc vận hành</strong>. Task tham gia ngân sách chỉ được tạo từ trang Tài chính: task cha nhận phân bổ, task con lập yêu cầu chi phí.
        </p>
      </Card>
      <Card
        title="Danh sách công việc"
      >
        {!canManageTasks ? (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-bg p-4 text-sm text-primary">
            <Eye size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Chỉ hiển thị công việc được giao</p>
              <p className="mt-1 text-primary">Bạn đang xem danh sách công việc được phân công cho tài khoản của mình trong sự kiện này.</p>
            </div>
          </div>
        ) : !canCreateTask ? (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-bg p-4 text-sm text-warning">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Chưa thể tạo công việc</p>
              <p className="mt-1 text-warning">{taskBlockedMessage}</p>
            </div>
          </div>
        ) : null}

        {isFormOpen ? (
          <div className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-neutral-900">Tạo công việc hàng loạt</h3>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" loading={isSuggesting} leftIcon={<Sparkles size={16} />} onClick={handleSuggestTasks}>
                  Gợi ý AI
                </Button>
                <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={16} />} onClick={handleAddCurrentTaskToDrafts}>
                  Thêm công việc
                </Button>
              </div>
            </div>
            <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-3">
              <FormField label="Ngữ cảnh cho AI">
                <Textarea
                  value={aiContext}
                  onChange={(event) => setAiContext(event.target.value)}
                  rows={3}
                  placeholder="Ví dụ: ưu tiên công việc trong ngày diễn ra, cần checklist bàn giao rõ, có vendor âm thanh riêng, tránh tạo task chuẩn bị đã hoàn tất..."
                />
              </FormField>
            </div>
            {errors.batch ? <p className="mb-3 text-sm font-medium text-danger">{errors.batch}</p> : null}
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-lg border border-neutral-200 p-4">
                  <SectionTitle title="Thông tin công việc" description="Tên, hạn hoàn thành và nội dung cần xử lý." />
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <FormField label="Tên công việc" required error={errors.title}>
                        <Input name="title" value={taskForm.title} onChange={handleChange} error={errors.title} placeholder="Chuẩn bị sân khấu" />
                      </FormField>
                    </div>
                    <FormField label="Hạn hoàn thành" required error={errors.dueTime}>
                      <Input name="dueTime" type="datetime-local" value={taskForm.dueTime} onChange={handleChange} error={errors.dueTime} />
                    </FormField>
                    <FormField label="Mức ưu tiên">
                      <Select name="priority" value={taskForm.priority} onChange={handleChange}>
                        {taskPriorityOptions.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <div className="lg:col-span-2">
                      <FormField label="Mô tả">
                        <Textarea name="description" value={taskForm.description} onChange={handleChange} rows={6} />
                      </FormField>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-4">
                  <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <SectionTitle title="Phân công" description="Chọn đội nhóm rồi chọn thành viên trong đội đó." />
                    <div className="mt-4 grid grid-cols-1 gap-4">
                      <FormField label="Đội nhóm">
                        <Select name="teamId" value={taskForm.teamId} onChange={handleChange}>
                          <option value="">Chưa gán đội nhóm</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Thành viên phụ trách">
                        <Select name="assigneeId" value={taskForm.assigneeId} onChange={handleChange} disabled={!taskForm.teamId}>
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
                    <SectionTitle title="Theo dõi" description="Trạng thái và tiến độ ban đầu." />
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField label="Trạng thái">
                        <Select name="status" value={taskForm.status} onChange={handleChange}>
                          {taskStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Tiến độ" error={errors.progress}>
                        <Input name="progress" type="number" min="0" max="100" value={taskForm.progress} onChange={handleChange} error={errors.progress} />
                      </FormField>
                    </div>
                  </section>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={handleAddCurrentTaskToDrafts}>
                  Thêm công việc
                </Button>
              </div>
            </div>
            {taskDrafts.length > 0 ? (
              <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
                <p className="text-sm font-semibold text-neutral-900">Công việc sẽ được lưu</p>
                <div className="mt-3 space-y-2">
                  {taskDrafts.map((draft, index) => (
                    <div key={draft.id} className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{index + 1}. {draft.title}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {draft.source === 'AI' ? <Badge variant="info">AI</Badge> : null}
                          <Badge variant="default">Công việc vận hành</Badge>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          {draft.priority} - {draft.status} - {formatDateTime(draft.dueTime)} - {draft.teamName} - {draft.assigneeName}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<X size={16} />}
                        onClick={() => setTaskDrafts((current) => current.filter((item) => item.id !== draft.id))}
                      >
                        Bỏ
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="button" loading={isSubmitting} disabled={taskDrafts.length === 0} onClick={handleCreateDrafts}>
                Lưu ({taskDrafts.length})
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-neutral-600">
            Hiển thị {pagedTasks.length}/{totalElements} công việc
          </p>
          <div className="w-full sm:w-56">
            <Select value={statusFilter} onChange={handleStatusFilterChange}>
              <option value="ALL">Tất cả trạng thái</option>
              {taskStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {totalElements === 0 && statusFilter === 'ALL' ? (
          <EmptyState icon={<ClipboardList size={24} />} title="Chưa có công việc" description="Tạo công việc để bắt đầu theo dõi tiến độ." />
        ) : filteredTasks.length === 0 ? (
          <EmptyState icon={<ClipboardList size={24} />} title="Không có công việc phù hợp" description="Đổi trạng thái lọc để xem công việc khác." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-300">
            <table className="min-w-full divide-y divide-neutral-100 text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Công việc</th>
                  <th className="px-4 py-3">Mức ưu tiên</th>
                  <th className="px-4 py-3">Hạn hoàn thành</th>
                  <th className="px-4 py-3">Tiến độ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Đội nhóm</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {pagedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{task.title}</p>
                      <Badge variant={financeRoleLabels[task.financeRole]?.variant || 'default'}>
                        {financeRoleLabels[task.financeRole]?.label || 'Công việc vận hành'}
                      </Badge>
                      <p className="text-xs text-neutral-500">{task.assigneeName || 'Chưa gán'}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{task.priority || 'MEDIUM'}</td>
                    <td className="px-4 py-3 text-neutral-700">{formatDateTime(task.dueTime)}</td>
                    <td className="px-4 py-3 text-neutral-700">{task.progress ?? 0}%</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[String(task.status || '').toLowerCase()] || 'default'}>{task.status || 'TODO'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-neutral-700">{getTaskTeamName(task)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="secondary" size="sm" leftIcon={<Eye size={16} />} onClick={() => navigate(`./${task.id}`)}>
                          Xem
                        </Button>
                        {canManageTasks ? (
                          <>
                            <Button type="button" variant="primary" size="sm" leftIcon={<Pencil size={16} />} onClick={() => navigate(`./${task.id}/edit`)}>
                              Sửa
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              leftIcon={<Trash2 size={16} />}
                              loading={actionId === `delete-${task.id}`}
                              onClick={() => setPendingDeleteTask(task)}
                            >
                              Xóa
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={goToPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </Card>
    <ConfirmDialog
      open={Boolean(pendingDeleteTask)}
      title="Xóa công việc"
      description={`Xóa ${pendingDeleteTask?.title || 'công việc'} khỏi sự kiện này?`}
      loading={actionId === `delete-${pendingDeleteTask?.id}`}
      onClose={() => setPendingDeleteTask(null)}
      onConfirm={handleConfirmDelete}
    />
    </>
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

function EventTasksPage() {
  const { eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ eventDetail, organizationId, accessContext }) => (
        canManageEventTasks(accessContext) ? (
          <EventTasksContent
            eventDetail={eventDetail}
            organizationId={organizationId}
            eventId={Number(eventId)}
            accessContext={accessContext}
            onError={setError}
            onSuccess={setSuccessMessage}
          />
        ) : (
          <Navigate to={`/organizations/${organizationId}/events/${eventId}/assigned-tasks`} replace />
        )
      )}
    </EventCaseLayout>
  )
}

function canCreateTaskForEvent(eventDetail) {
  if (!eventDetail) return false
  if (!['draft', 'published', 'ongoing'].includes(String(eventDetail.status || '').toLowerCase())) return false

  const now = new Date()
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (end && now > end) return false
  return true
}

function canManageEventTasks(accessContext) {
  return Array.isArray(accessContext?.allowedActions) && accessContext.allowedActions.includes('TASK_MANAGE')
}

function getTaskCreationBlockedMessage(eventDetail) {
  if (!eventDetail) return 'Không xác định được thông tin sự kiện.'
  if (!['draft', 'published', 'ongoing'].includes(String(eventDetail.status || '').toLowerCase())) {
    return 'Không thể tạo công việc khi sự kiện đã hoàn tất, đã hủy hoặc đã xóa.'
  }

  const now = new Date()
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (end && now > end) return 'Sự kiện đã kết thúc.'
  return 'Không thể tạo công việc cho sự kiện này.'
}

function validateTaskDueTime(eventDetail, dueTimeValue) {
  const dueTime = new Date(dueTimeValue)
  if (Number.isNaN(dueTime.getTime())) return 'Hạn hoàn thành không hợp lệ'

  const now = new Date()
  if (dueTime < now) return 'Hạn hoàn thành không được trước thời điểm hiện tại'

  const end = eventDetail?.endTime ? new Date(eventDetail.endTime) : null

  if (end && dueTime > end) return 'Hạn hoàn thành không được sau thời gian kết thúc sự kiện'
  return null
}

export default EventTasksPage
