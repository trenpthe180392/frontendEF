import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Eye, Filter, Plus, RefreshCw, Save, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { eventMemberApi, issueApi, issueParticipantApi, teamApi, teamMemberApi } from '../api'
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
import Spinner from '../components/ui/Spinner'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { normalizeEventMember, taskPriorityOptions, toApiDateTime } from '../features/events/eventPageUtils'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { normalizeTeamMember } from '../features/teams/teamPageUtils'
import { getErrorMessage, getFieldErrors } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const emptyIssueForm = {
  title: '',
  description: '',
  type: '',
  priority: 'MEDIUM',
  status: 'OPEN',
  dueDate: '',
  impactLevel: 'MEDIUM',
  teamId: '',
  assignedToUserId: '',
}

const issueStatusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
const issueStatusLabels = {
  OPEN: 'Mới mở',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
  REJECTED: 'Từ chối',
}

const issueStatusVariants = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'default',
  REJECTED: 'danger',
}

const issueParticipantRoleOptions = ['REPORTER', 'ASSIGNEE', 'WATCHER', 'REVIEWER']
const issueParticipantRoleLabels = {
  REPORTER: 'Người báo cáo',
  ASSIGNEE: 'Người xử lý',
  WATCHER: 'Theo dõi',
  REVIEWER: 'Reviewer',
}

const participantStatusOptions = ['ACTIVE', 'INACTIVE', 'PENDING', 'BANNED']
const participantStatusLabels = {
  ACTIVE: 'Đang tham gia',
  INACTIVE: 'Không hoạt động',
  PENDING: 'Đang chờ',
  BANNED: 'Bị chặn',
}

const priorityLabels = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Khẩn cấp',
}

const priorityVariants = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
}

const DEFAULT_ISSUES_PER_PAGE = 10

function IssueListContent({ context, eventId, teamId = null, onError, onSuccess }) {
  const [issues, setIssues] = useState([])
  const [teams, setTeams] = useState([])
  const [assignees, setAssignees] = useState([])
  const [form, setForm] = useState({ ...emptyIssueForm, teamId: teamId ? String(teamId) : '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_ISSUES_PER_PAGE)

  async function loadIssues() {
    setIsLoading(true)
    onError(null)

    try {
      const issueData = context === 'team' ? await issueApi.getByTeam(teamId) : await issueApi.getByEvent(eventId)
      const [membersResponse, teamsResponse] = await Promise.all([
        context === 'team' ? teamMemberApi.getByTeam(teamId) : eventMemberApi.getByEvent(eventId),
        context === 'event' ? teamApi.getByEvent(eventId) : Promise.resolve({ data: [] }),
      ])

      const issuesData = issueData?.data || issueData || [];
      setIssues((Array.isArray(issuesData) ? issuesData : []).map(normalizeIssue))
      setAssignees(normalizePageResponse(membersResponse.data, 100).items.map(context === 'team' ? normalizeTeamMember : normalizeEventMember))
      setTeams(normalizePageResponse(teamsResponse.data, 100).items)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadIssues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, eventId, teamId])

  const filteredIssues = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return issues.filter((issue) => {
      const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter
      const matchesPriority = priorityFilter === 'ALL' || issue.priority === priorityFilter
      const matchesSearch =
        !keyword ||
        [issue.title, issue.description, issue.type, issue.teamName, issue.assignedToUserName, issue.reportedByUserName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
      return matchesStatus && matchesPriority && matchesSearch
    })
  }, [issues, priorityFilter, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pagedIssues = filteredIssues.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
  const openCount = issues.filter((issue) => ['OPEN', 'IN_PROGRESS'].includes(issue.status)).length
  const resolvedCount = issues.filter((issue) => ['RESOLVED', 'CLOSED'].includes(issue.status)).length

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function validateForm() {
    const nextErrors = {}
    const dueDate = form.dueDate ? new Date(form.dueDate) : null

    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề issue'
    if (!form.description.trim()) nextErrors.description = 'Vui lòng nhập mô tả issue'
    if (!form.type.trim()) nextErrors.type = 'Vui lòng nhập loại issue'
    if (!taskPriorityOptions.includes(form.priority)) nextErrors.priority = 'Mức ưu tiên không hợp lệ'
    if (!issueStatusOptions.includes(form.status)) nextErrors.status = 'Trạng thái không hợp lệ'
    if (dueDate && dueDate < new Date(Date.now() - 60000)) nextErrors.dueDate = 'Hạn xử lý không được ở quá khứ'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildPayload() {
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type.trim(),
      priority: form.priority,
      status: form.status,
      dueDate: toApiDateTime(form.dueDate),
      impactLevel: form.impactLevel || null,
      resolution: null,
      eventId,
      teamId: context === 'team' ? teamId : form.teamId ? Number(form.teamId) : null,
      assignedToUserId: form.assignedToUserId ? Number(form.assignedToUserId) : null,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      const createdIssue = await issueApi.create(buildPayload())
      resetForm()
      setIsFormOpen(false)
      await loadIssues()
      onSuccess(createdIssue?.message || 'Đã tạo issue')
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setForm({ ...emptyIssueForm, teamId: teamId ? String(teamId) : '' })
    setErrors({})
  }

  function closeForm() {
    resetForm()
    setIsFormOpen(false)
  }

  function handleFilterChange(setter) {
    return (event) => {
      setter(event.target.value)
      setCurrentPage(1)
    }
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value)
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Đang tải danh sách issue...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title={context === 'team' ? 'Issue đội nhóm' : 'Issue sự kiện'}
        description="Theo dõi rủi ro, sự cố và vấn đề vận hành cần xử lý trong sự kiện."
        icon={<AlertTriangle size={24} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={loadIssues}>
              Tải lại
            </Button>
            <Button
              type="button"
              variant={isFormOpen ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={isFormOpen ? <X size={16} /> : <Plus size={16} />}
              onClick={isFormOpen ? closeForm : () => setIsFormOpen(true)}
            >
              {isFormOpen ? 'Đóng biểu mẫu' : 'Báo cáo issue'}
            </Button>
          </div>
        }
        stats={[
          { label: 'Tổng issue', value: issues.length },
          { label: 'Đang mở', value: openCount },
          { label: 'Đã xử lý', value: resolvedCount },
          { label: 'Đang hiển thị', value: filteredIssues.length },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.7fr)]">
        <Card title="Danh sách issue">
          {isFormOpen ? (
            <IssueCreateForm
              context={context}
              form={form}
              errors={errors}
              teams={teams}
              assignees={assignees}
              isSubmitting={isSubmitting}
              onChange={handleChange}
              onCancel={closeForm}
              onSubmit={handleSubmit}
            />
          ) : null}

          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
            <Input value={searchTerm} onChange={handleSearchChange} placeholder="Tìm theo tiêu đề, mô tả, người phụ trách..." />
            <Select value={statusFilter} onChange={handleFilterChange(setStatusFilter)}>
              <option value="ALL">Tất cả trạng thái</option>
              {issueStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {issueStatusLabels[status]}
                </option>
              ))}
            </Select>
            <Select value={priorityFilter} onChange={handleFilterChange(setPriorityFilter)}>
              <option value="ALL">Tất cả ưu tiên</option>
              {taskPriorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabels[priority]}
                </option>
              ))}
            </Select>
          </div>

          {issues.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle size={24} />}
              title="Chưa có issue"
              description="Báo cáo issue đầu tiên để cả đội nhìn thấy rủi ro và phối hợp xử lý sớm."
              action={
                <Button type="button" leftIcon={<Plus size={16} />} onClick={() => setIsFormOpen(true)}>
                  Báo cáo issue
                </Button>
              }
            />
          ) : filteredIssues.length === 0 ? (
            <EmptyState
              icon={<Filter size={24} />}
              title="Không có issue phù hợp"
              description="Đổi bộ lọc hoặc từ khóa để xem issue khác."
            />
          ) : (
            <div className="space-y-3">
              {pagedIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  selected={selectedIssue?.id === issue.id}
                  onSelect={setSelectedIssue}
                />
              ))}
            </div>
          )}

          <PaginationControls
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setCurrentPage(1)
            }}
          />
        </Card>

        <IssueDetailPanel
          issue={selectedIssue}
          assignees={assignees}
          onIssueUpdated={setSelectedIssue}
          onRefreshList={loadIssues}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  )
}

function IssueCreateForm({ context, form, errors, teams, assignees, isSubmitting, onChange, onCancel, onSubmit }) {
  return (
    <form className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormField label="Tiêu đề" required error={errors.title}>
          <Input name="title" value={form.title} onChange={onChange} error={errors.title} placeholder="Âm thanh sân khấu lỗi..." />
        </FormField>
        <FormField label="Loại issue" required error={errors.type}>
          <Input name="type" value={form.type} onChange={onChange} error={errors.type} placeholder="technical, logistics, staffing..." />
        </FormField>
        <FormField label="Mức ưu tiên" error={errors.priority}>
          <Select name="priority" value={form.priority} onChange={onChange} error={errors.priority}>
            {taskPriorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]} ({priority})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Trạng thái" error={errors.status}>
          <Select name="status" value={form.status} onChange={onChange} error={errors.status}>
            {issueStatusOptions.map((status) => (
              <option key={status} value={status}>
                {issueStatusLabels[status]} ({status})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Hạn xử lý" error={errors.dueDate}>
          <Input name="dueDate" type="datetime-local" value={form.dueDate} onChange={onChange} error={errors.dueDate} />
        </FormField>
        <FormField label="Mức ảnh hưởng" error={errors.impactLevel}>
          <Select name="impactLevel" value={form.impactLevel} onChange={onChange} error={errors.impactLevel}>
            {taskPriorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]} ({priority})
              </option>
            ))}
          </Select>
        </FormField>
        {context === 'event' ? (
          <FormField label="Đội nhóm liên quan">
            <Select name="teamId" value={form.teamId} onChange={onChange}>
              <option value="">Issue cấp sự kiện</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}
        <FormField label="Người phụ trách">
          <Select name="assignedToUserId" value={form.assignedToUserId} onChange={onChange}>
            <option value="">Chưa gán</option>
            {assignees.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.userName} - Mã {member.userId}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="lg:col-span-2">
          <FormField label="Mô tả" required error={errors.description}>
            <Textarea
              name="description"
              value={form.description}
              onChange={onChange}
              error={errors.description}
              placeholder="Mô tả sự cố, ảnh hưởng, bối cảnh và thông tin cần theo dõi..."
            />
          </FormField>
        </div>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting} leftIcon={<Plus size={16} />}>
          Tạo issue
        </Button>
      </div>
    </form>
  )
}

function IssueCard({ issue, selected, onSelect }) {
  return (
    <article className={selected ? 'rounded-xl border border-primary bg-primary-bg p-4' : 'rounded-xl border border-neutral-200 bg-white p-4'}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-neutral-900">{issue.title}</h2>
            <Badge variant={issueStatusVariants[issue.status] || 'default'}>{issueStatusLabels[issue.status] || issue.status}</Badge>
            <Badge variant={priorityVariants[issue.priority] || 'default'}>{priorityLabels[issue.priority] || issue.priority}</Badge>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{issue.type || 'Issue'}</p>
          <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{issue.description || 'Chưa có mô tả'}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-neutral-500 md:grid-cols-2">
            <p>Team: <span className="font-semibold text-neutral-700">{issue.teamName || 'Cấp sự kiện'}</span></p>
            <p>Người phụ trách: <span className="font-semibold text-neutral-700">{issue.assignedToUserName || 'Chưa gán'}</span></p>
            <p>Reporter: <span className="font-semibold text-neutral-700">{issue.reportedByUserName || 'Chưa có'}</span></p>
            <p>Hạn xử lý: <span className="font-semibold text-neutral-700">{formatDateTime(issue.dueDate)}</span></p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" leftIcon={<Eye size={16} />} onClick={() => onSelect(issue)}>
          Chi tiết
        </Button>
      </div>
    </article>
  )
}

function IssueDetailPanel({ issue, assignees, onIssueUpdated, onRefreshList, onSuccess }) {
  const [detail, setDetail] = useState(null)
  const [participants, setParticipants] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)
  const [statusForm, setStatusForm] = useState({ status: 'OPEN', resolution: '' })
  const [assignUserId, setAssignUserId] = useState('')
  const [participantForm, setParticipantForm] = useState({ userId: '', role: 'WATCHER', status: 'ACTIVE' })
  const [formErrors, setFormErrors] = useState({})
  const [actionLoading, setActionLoading] = useState(null)
  const [participantToRemove, setParticipantToRemove] = useState(null)

  async function loadDetail(issueId) {
    if (!issueId) return

    setIsLoading(true)
    setDetailError(null)

    try {
      const [issueDetail, participantData] = await Promise.all([
        issueApi.getById(issueId),
        issueParticipantApi.getByIssue(issueId),
      ])
      const normalizedDetail = normalizeIssue(issueDetail || issue)
      const normalizedParticipants = (Array.isArray(participantData) ? participantData : []).map(normalizeParticipant)

      setDetail(normalizedDetail)
      setParticipants(normalizedParticipants)
      setStatusForm({ status: normalizedDetail.status, resolution: normalizedDetail.resolution || '' })
      setAssignUserId(normalizedDetail.assignedToUserId ? String(normalizedDetail.assignedToUserId) : '')
      setParticipantForm({ userId: '', role: 'WATCHER', status: 'ACTIVE' })
      onIssueUpdated(normalizedDetail)
    } catch (err) {
      setDetail(issue ? normalizeIssue(issue) : null)
      setDetailError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setDetail(null)
    setParticipants([])
    setFormErrors({})
    setDetailError(null)
    loadDetail(issue?.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue?.id])

  async function refreshDetail(nextIssue = detail) {
    if (!nextIssue?.id) return
    await loadDetail(nextIssue.id)
    await onRefreshList?.()
  }

  function handleStatusChange(event) {
    const { name, value } = event.target
    setStatusForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: null }))
    setDetailError(null)
  }

  async function handleStatusSubmit(event) {
    event.preventDefault()
    if (!detail) return

    const nextErrors = {}
    if (!issueStatusOptions.includes(statusForm.status)) nextErrors.status = 'Trạng thái không hợp lệ'
    if (statusForm.resolution.length > 1000) nextErrors.resolution = 'Resolution tối đa 1000 ký tự'

    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setActionLoading('status')
    setDetailError(null)

    try {
      const updatedIssue = await issueApi.updateStatus(detail.id, {
        status: statusForm.status,
        resolution: statusForm.resolution.trim() || null,
      })
      const normalizedIssue = normalizeIssue(updatedIssue || detail)
      setDetail(normalizedIssue)
      setStatusForm({ status: normalizedIssue.status, resolution: normalizedIssue.resolution || '' })
      onIssueUpdated(normalizedIssue)
      await onRefreshList?.()
      onSuccess?.(updatedIssue?.message || 'Đã cập nhật trạng thái issue')
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setFormErrors(fieldErrors)
      setDetailError(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAssignSubmit(event) {
    event.preventDefault()
    if (!detail) return

    if (!assignUserId) {
      setFormErrors((current) => ({ ...current, assignedToUserId: 'Vui lòng chọn người phụ trách' }))
      return
    }

    setActionLoading('assign')
    setDetailError(null)

    try {
      const updatedIssue = await issueApi.assign(detail.id, Number(assignUserId))
      const normalizedIssue = normalizeIssue(updatedIssue || detail)
      setDetail(normalizedIssue)
      onIssueUpdated(normalizedIssue)
      await refreshDetail(normalizedIssue)
      onSuccess?.(updatedIssue?.message || 'Đã gán người phụ trách')
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setFormErrors(fieldErrors)
      setDetailError(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  function handleParticipantChange(event) {
    const { name, value } = event.target
    setParticipantForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: null }))
    setDetailError(null)
  }

  async function handleParticipantSubmit(event) {
    event.preventDefault()
    if (!detail) return

    const nextErrors = {}
    const selectedUserId = Number(participantForm.userId)
    const alreadyJoined = participants.some((participant) => Number(participant.userId) === selectedUserId)

    if (!participantForm.userId) nextErrors.participantUserId = 'Vui lòng chọn thành viên'
    if (alreadyJoined) nextErrors.participantUserId = 'Thành viên này đã trong danh sách participant'
    if (!issueParticipantRoleOptions.includes(participantForm.role)) nextErrors.participantRole = 'Vai trò participant không hợp lệ'
    if (!participantStatusOptions.includes(participantForm.status)) nextErrors.participantStatus = 'Trạng thái participant không hợp lệ'

    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setActionLoading('participant')
    setDetailError(null)

    try {
      const participant = await issueParticipantApi.add({
        issueId: detail.id,
        userId: selectedUserId,
        role: participantForm.role,
        status: participantForm.status,
      })
      setParticipantForm({ userId: '', role: 'WATCHER', status: 'ACTIVE' })
      await refreshDetail()
      onSuccess?.(participant?.message || 'Đã thêm participant')
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setFormErrors(fieldErrors)
      setDetailError(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRemoveParticipant() {
    if (!detail || !participantToRemove) return

    setActionLoading('removeParticipant')
    setDetailError(null)

    try {
      const removed = await issueParticipantApi.remove(detail.id, participantToRemove.userId)
      setParticipantToRemove(null)
      await refreshDetail()
      onSuccess?.(removed?.message || 'Đã xóa participant')
    } catch (err) {
      setDetailError(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  const availableParticipants = assignees.filter((member) => {
    return !participants.some((participant) => Number(participant.userId) === Number(member.userId))
  })
  const displayIssue = detail || issue

  return (
    <Card title="Chi tiết issue">
      {!issue ? (
        <EmptyState
          icon={<AlertTriangle size={24} />}
          title="Chưa chọn issue"
          description="Chọn một issue trong danh sách để xem chi tiết, cập nhật trạng thái, gán người phụ trách và quản lý participant."
        />
      ) : isLoading && !displayIssue ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Đang tải chi tiết issue...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-info/20 bg-info-bg p-3 text-sm font-semibold text-info">
              <Spinner size="sm" />
              Đang làm mới chi tiết issue...
            </div>
          ) : null}
          {detailError ? (
            <div className="rounded-lg border border-danger/20 bg-danger-bg p-3 text-sm font-semibold text-danger">
              {detailError}
            </div>
          ) : null}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={issueStatusVariants[displayIssue.status] || 'default'}>
                {issueStatusLabels[displayIssue.status] || displayIssue.status}
              </Badge>
              <Badge variant={priorityVariants[displayIssue.priority] || 'default'}>
                {priorityLabels[displayIssue.priority] || displayIssue.priority}
              </Badge>
            </div>
            <h2 className="mt-3 text-xl font-bold text-neutral-900">{displayIssue.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{displayIssue.description || 'Chưa có mô tả'}</p>
          </div>

          <form className="rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={handleStatusSubmit}>
            <div className="mb-3 flex items-center gap-2">
              <Save size={16} className="text-primary" />
              <h3 className="font-bold text-neutral-900">Cập nhật trạng thái</h3>
            </div>
            <div className="space-y-3">
              <FormField label="Trạng thái" error={formErrors.status}>
                <Select name="status" value={statusForm.status} onChange={handleStatusChange} error={formErrors.status}>
                  {issueStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {issueStatusLabels[status]} ({status})
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Resolution" error={formErrors.resolution}>
                <Textarea
                  name="resolution"
                  value={statusForm.resolution}
                  onChange={handleStatusChange}
                  error={formErrors.resolution}
                  placeholder="Ghi chú cách xử lý, lý do đóng hoặc phản hồi nếu backend yêu cầu..."
                />
              </FormField>
              <Button type="submit" size="sm" loading={actionLoading === 'status'} leftIcon={<Save size={16} />}>
                Lưu trạng thái
              </Button>
            </div>
          </form>

          <form className="rounded-xl border border-neutral-200 bg-white p-4" onSubmit={handleAssignSubmit}>
            <div className="mb-3 flex items-center gap-2">
              <UserPlus size={16} className="text-primary" />
              <h3 className="font-bold text-neutral-900">Gán người phụ trách</h3>
            </div>
            <div className="space-y-3">
              <FormField label="Người phụ trách" error={formErrors.assignedToUserId}>
                <Select
                  value={assignUserId}
                  onChange={(event) => {
                    setAssignUserId(event.target.value)
                    setFormErrors((current) => ({ ...current, assignedToUserId: null }))
                    setDetailError(null)
                  }}
                  error={formErrors.assignedToUserId}
                >
                  <option value="">Chọn thành viên</option>
                  {assignees.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.userName} - Mã {member.userId}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button type="submit" size="sm" loading={actionLoading === 'assign'} leftIcon={<UserPlus size={16} />}>
                Gán issue
              </Button>
            </div>
          </form>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="font-bold text-neutral-900">Participants / watchers</h3>
            </div>
            <form className="grid grid-cols-1 gap-3" onSubmit={handleParticipantSubmit}>
              <FormField label="Thành viên" error={formErrors.participantUserId}>
                <Select
                  name="userId"
                  value={participantForm.userId}
                  onChange={handleParticipantChange}
                  error={formErrors.participantUserId}
                >
                  <option value="">Chọn thành viên</option>
                  {availableParticipants.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.userName} - Mã {member.userId}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Vai trò" error={formErrors.participantRole}>
                  <Select
                    name="role"
                    value={participantForm.role}
                    onChange={handleParticipantChange}
                    error={formErrors.participantRole}
                  >
                    {issueParticipantRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {issueParticipantRoleLabels[role]} ({role})
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Trạng thái" error={formErrors.participantStatus}>
                  <Select
                    name="status"
                    value={participantForm.status}
                    onChange={handleParticipantChange}
                    error={formErrors.participantStatus}
                  >
                    {participantStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {participantStatusLabels[status]} ({status})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-fit"
                loading={actionLoading === 'participant'}
                leftIcon={<UserPlus size={16} />}
                disabled={availableParticipants.length === 0}
              >
                Thêm participant
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {participants.length === 0 ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
                  Chưa có participant. Thêm watcher hoặc reviewer để họ theo dõi issue này.
                </div>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.issueParticipantId || `${participant.issueId}-${participant.userId}`}
                    className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">{participant.userName || `User ${participant.userId}`}</p>
                      <p className="text-xs text-neutral-500">
                        {issueParticipantRoleLabels[participant.role] || participant.role} ·{' '}
                        {participantStatusLabels[participant.status] || participant.status} · Tham gia{' '}
                        {formatDateTime(participant.joinedAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      leftIcon={<UserMinus size={16} />}
                      onClick={() => setParticipantToRemove(participant)}
                    >
                      Xóa
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DetailRow label="Loại" value={displayIssue.type} />
          <DetailRow label="Mức ảnh hưởng" value={displayIssue.impactLevel} />
          <DetailRow label="Sự kiện" value={displayIssue.eventName || displayIssue.eventId} />
          <DetailRow label="Đội nhóm" value={displayIssue.teamName || 'Cấp sự kiện'} />
          <DetailRow label="Người report" value={displayIssue.reportedByUserName || displayIssue.reportedByUserId} />
          <DetailRow label="Người phụ trách" value={displayIssue.assignedToUserName || 'Chưa gán'} />
          <DetailRow label="Participant" value={displayIssue.participantCount ?? participants.length} />
          <DetailRow label="Hạn xử lý" value={formatDateTime(displayIssue.dueDate)} />
          <DetailRow label="Đã xử lý lúc" value={formatDateTime(displayIssue.resolvedAt)} />
          <DetailRow label="Resolution hiện tại" value={displayIssue.resolution || 'Chưa có'} />

          <ConfirmDialog
            open={Boolean(participantToRemove)}
            title="Xóa participant khỏi issue?"
            description={`Thành viên ${participantToRemove?.userName || participantToRemove?.userId || ''} sẽ không còn theo dõi issue này.`}
            loading={actionLoading === 'removeParticipant'}
            onClose={() => setParticipantToRemove(null)}
            onConfirm={handleRemoveParticipant}
          />
        </div>
      )}
    </Card>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-neutral-900">{value || 'Chưa có'}</p>
    </div>
  )
}

function normalizeIssue(issue) {
  return {
    id: issue.id,
    title: issue.title || 'Issue chưa có tiêu đề',
    description: issue.description || '',
    type: issue.type || '',
    priority: issue.priority || 'MEDIUM',
    status: issue.status || 'OPEN',
    resolvedAt: issue.resolvedAt || null,
    dueDate: issue.dueDate || null,
    impactLevel: issue.impactLevel || '',
    resolution: issue.resolution || '',
    eventId: issue.eventId,
    eventName: issue.eventName || '',
    teamId: issue.teamId || null,
    teamName: issue.teamName || '',
    reportedByUserId: issue.reportedByUserId || null,
    reportedByUserName: issue.reportedByUserName || '',
    assignedToUserId: issue.assignedToUserId || null,
    assignedToUserName: issue.assignedToUserName || '',
    participantCount: issue.participantCount ?? 0,
    createAt: issue.createAt || null,
    updateAt: issue.updateAt || null,
    message: issue.message || '',
  }
}

function normalizeParticipant(participant) {
  return {
    issueParticipantId: participant.issueParticipantId || participant.id || null,
    issueId: participant.issueId,
    issueTitle: participant.issueTitle || '',
    userId: participant.userId,
    userName: participant.userName || '',
    role: participant.role || 'WATCHER',
    status: participant.status || 'ACTIVE',
    joinedAt: participant.joinedAt || null,
    message: participant.message || '',
  }
}

function EventIssuesPage() {
  const { eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <IssueListContent
          context="event"
          eventId={Number(eventId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

function TeamIssuesPage() {
  const { eventId, teamId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <IssueListContent
          context="team"
          eventId={Number(eventId)}
          teamId={Number(teamId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </TeamCaseLayout>
  )
}

export { EventIssuesPage, TeamIssuesPage }
