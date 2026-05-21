import { useEffect, useState } from 'react'
import { ClipboardList, Eye, Pencil, Plus, Sparkles, TriangleAlert, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { aiApi, taskApi, teamApi, teamMemberApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PaginationControls from '../components/ui/PaginationControls'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { normalizeTeamMember } from '../features/teams/teamPageUtils'
import { taskPriorityOptions, taskStatusOptions, toApiDateTime, toDateTimeLocalValue } from '../features/events/eventPageUtils'
import { statusVariant } from '../features/organizations/organizationConstants'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const emptyForm = { title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueTime: '', assigneeId: '', progress: '0' }
const DEFAULT_TASKS_PER_PAGE = 10

function normalizeTaskPage(responseData, pageSize = DEFAULT_TASKS_PER_PAGE) {
  if (Array.isArray(responseData)) {
    return {
      content: responseData,
      totalElements: responseData.length,
      totalPages: Math.max(1, Math.ceil(responseData.length / pageSize)),
      number: 0,
    }
  }
  return {
    content: responseData?.content || [],
    totalElements: responseData?.totalElements || 0,
    totalPages: Math.max(1, responseData?.totalPages || 1),
    number: responseData?.number || 0,
  }
}

function TeamTasksContent({ eventDetail, organizationId, eventId, teamId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [drafts, setDrafts] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TASKS_PER_PAGE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [actionId, setActionId] = useState(null)

  async function loadTasks() {
    onError(null)
    try {
      const taskParams = {
        page: currentPage - 1,
        size: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }
      const [tasksResponse, membersResponse, teamResponse] = await Promise.all([taskApi.getByTeam(teamId, taskParams), teamMemberApi.getByTeam(teamId), teamApi.getById(teamId)])
      const taskPage = normalizeTaskPage(tasksResponse.data, pageSize)
      setTasks(taskPage.content)
      setTotalElements(taskPage.totalElements)
      setTotalPages(taskPage.totalPages)
      setCurrentPage(taskPage.number + 1)
      setMembers((membersResponse.data || []).map(normalizeTeamMember))
      setTeam(teamResponse.data || null)
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, currentPage, pageSize, statusFilter])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null, batch: null }))
  }

  function validateForm() {
    const nextErrors = {}
    if (!canCreateTaskForEvent(eventDetail)) {
      nextErrors.event = getTaskCreationBlockedMessage(eventDetail)
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

  function validateDrafts() {
    if (!canCreateTaskForEvent(eventDetail)) {
      setErrors({ batch: getTaskCreationBlockedMessage(eventDetail) })
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
      priority: formValue.priority,
      status: formValue.status,
      dueTime: toApiDateTime(formValue.dueTime),
      eventId,
      teamId,
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

  function isSuggestionForCurrentTeam(task) {
    if (!task.assignedTeam || !team?.name) return false
    return task.assignedTeam.trim().toLowerCase() === team.name.trim().toLowerCase()
  }

  function handleAddCurrentTaskToDrafts() {
    if (!validateForm()) return

    const member = members.find((item) => Number(item.userId) === Number(form.assigneeId))
    setDrafts((current) => [
      ...current,
      {
        ...form,
        id: `${Date.now()}-${current.length}`,
        assigneeName: member?.userName || 'Chưa gán thành viên',
      },
    ])
    setForm(emptyForm)
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
      const response = await aiApi.suggestTasks(eventId)
      const suggestions = (response.data?.tasks || []).filter(isSuggestionForCurrentTeam)
      if (suggestions.length === 0) {
        onSuccess('AI chưa trả về công việc gợi ý cho đội nhóm này')
        return
      }

      const suggestionDrafts = suggestions.map((task, index) => ({
        id: `ai-${Date.now()}-${index}`,
        title: task.title?.trim() || `Công việc AI ${index + 1}`,
        description: task.description || '',
        priority: normalizeSuggestionPriority(task.priority),
        status: normalizeSuggestionStatus(task.status),
        dueTime: toDateTimeLocalValue(task.dueTime),
        assigneeId: '',
        progress: task.progress != null ? String(task.progress) : '0',
        assigneeName: 'Chưa gán thành viên',
        source: 'AI',
      }))

      setDrafts((current) => [...current, ...suggestionDrafts])
      onSuccess(`AI đã gợi ý ${suggestionDrafts.length} công việc cho đội nhóm này. Kiểm tra rồi lưu để tạo.`)
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
      setDrafts([])
      setIsFormOpen(false)
      await loadTasks()
      onSuccess(`Đã tạo ${drafts.length} công việc cho đội nhóm`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeForm() {
    setForm(emptyForm)
    setDrafts([])
    setErrors({})
    setIsFormOpen(false)
  }

  async function handleAssignMember(task, userId) {
    setActionId(`assign-user-${task.id}`)
    onError(null)
    onSuccess(null)

    try {
      if (userId) {
        await taskApi.reassignUser(task.id, Number(userId))
        onSuccess('Đã gán công việc cho thành viên')
      } else {
        await taskApi.unassign(task.id)
        onSuccess('Đã bỏ gán thành viên')
      }
      await loadTasks()
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  const filteredTasks = statusFilter === 'ALL' ? tasks : tasks.filter((task) => String(task.status || 'TODO') === statusFilter)
  const pagedTasks = filteredTasks
  const canCreateTask = canCreateTaskForEvent(eventDetail)
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

  return (
    <>
      <Card
        title="Công việc của đội nhóm"
        headerRight={
          <Button
            type="button"
            variant={isFormOpen ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={isFormOpen ? <X size={16} /> : <Plus size={16} />}
            onClick={isFormOpen ? closeForm : () => navigate(`/organizations/${organizationId}/events/${eventId}/teams/${teamId}/tasks/create`)}
            disabled={!canCreateTask && !isFormOpen}
          >
            {isFormOpen ? 'Đóng biểu mẫu' : 'Tạo công việc'}
          </Button>
        }
      >
        {!canCreateTask ? (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-bg p-4 text-sm text-warning">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Chưa thể tạo công việc cho đội nhóm</p>
              <p className="mt-1">{taskBlockedMessage}</p>
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
            {errors.batch ? <p className="mb-3 text-sm font-medium text-danger">{errors.batch}</p> : null}
            <div className="rounded-lg border border-neutral-200 bg-white p-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <FormField label="Tên công việc" required error={errors.title}>
                  <Input name="title" value={form.title} onChange={handleChange} error={errors.title} />
                </FormField>
                <FormField label="Thành viên phụ trách">
                  <Select name="assigneeId" value={form.assigneeId} onChange={handleChange}>
                    <option value="">Chưa gán thành viên</option>
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
                  <Textarea name="description" value={form.description} onChange={handleChange} />
                </FormField>
              </div>
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={16} />} onClick={handleAddCurrentTaskToDrafts}>
                  Thêm công việc
                </Button>
              </div>
            </div>
            {drafts.length > 0 ? (
              <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
                <p className="text-sm font-semibold text-neutral-900">Công việc sẽ được lưu</p>
                <div className="mt-3 space-y-2">
                  {drafts.map((draft, index) => (
                    <div key={draft.id} className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{index + 1}. {draft.title}</p>
                        {draft.source === 'AI' ? <Badge variant="info">AI</Badge> : null}
                        <p className="mt-1 text-xs text-neutral-500">
                          {draft.priority} - {draft.status} - {formatDateTime(draft.dueTime)} - {draft.assigneeName}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<X size={16} />}
                        onClick={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}
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
              <Button type="button" loading={isSubmitting} disabled={drafts.length === 0} onClick={handleCreateDrafts}>
                Lưu ({drafts.length})
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
          <EmptyState icon={<ClipboardList size={24} />} title="Chưa có công việc" description="Công việc của đội nhóm sẽ hiển thị tại đây." />
        ) : filteredTasks.length === 0 ? (
          <EmptyState icon={<ClipboardList size={24} />} title="Không có công việc phù hợp" description="Đổi trạng thái lọc để xem công việc khác." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-300">
            <table className="min-w-full divide-y divide-neutral-100 text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Công việc</th>
                  <th className="px-4 py-3">Mức ưu tiên</th>
                  <th className="px-4 py-3">Hạn hoàn thành</th>
                  <th className="px-4 py-3">Tiến độ</th>
                  <th className="px-4 py-3">Thành viên</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {pagedTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{task.title}</p>
                      <p className="text-xs text-neutral-500">{task.assigneeName || 'Chưa gán'}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{task.priority || 'MEDIUM'}</td>
                    <td className="px-4 py-3 text-neutral-700">{formatDateTime(task.dueTime)}</td>
                    <td className="px-4 py-3 text-neutral-700">{task.progress ?? 0}%</td>
                    <td className="px-4 py-3">
                      <Select
                        value={task.assigneeId || ''}
                        onChange={(event) => handleAssignMember(task, event.target.value)}
                        disabled={actionId === `assign-user-${task.id}`}
                      >
                        <option value="">Chưa gán thành viên</option>
                        {members.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.userName}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[String(task.status || '').toLowerCase()] || 'default'}>{task.status || 'TODO'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" leftIcon={<Eye size={16} />} onClick={() => navigate(`./${task.id}`)}>
                          Xem
                        </Button>
                        <Button type="button" variant="ghost" size="sm" leftIcon={<Pencil size={16} />} onClick={() => navigate(`./${task.id}/edit`)}>
                          Sửa
                        </Button>
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
    </>
  )
}

function TeamTasksPage() {
  const { organizationId, eventId, teamId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ eventDetail }) => (
        <TeamTasksContent
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

function canCreateTaskForEvent(eventDetail) {
  if (!eventDetail) return false
  if (eventDetail.status !== 'ongoing') return false

  const now = new Date()
  const start = eventDetail.startTime ? new Date(eventDetail.startTime) : null
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

function getTaskCreationBlockedMessage(eventDetail) {
  if (!eventDetail) return 'Không xác định được thông tin sự kiện.'
  if (eventDetail.status !== 'ongoing') return 'Công việc chỉ được tạo khi sự kiện ở trạng thái Đang diễn ra.'

  const now = new Date()
  const start = eventDetail.startTime ? new Date(eventDetail.startTime) : null
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (start && now < start) return 'Chưa đến thời gian bắt đầu sự kiện.'
  if (end && now > end) return 'Sự kiện đã kết thúc.'
  return 'Công việc chỉ được tạo trong khoảng thời gian diễn ra sự kiện.'
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

export default TeamTasksPage
