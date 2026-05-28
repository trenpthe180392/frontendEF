import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  MessageSquareMore,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Upload,
  X,
  XCircle,
} from 'lucide-react'

import { financeApi, taskApi } from '../../api'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import FormField from '../../components/form/FormField'
import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PaginationControls from '../../components/ui/PaginationControls'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import Textarea from '../../components/ui/Textarea'
import { getErrorMessage, getFieldErrors } from '../../utils'
import { formatCurrency, formatDateTime } from '../../utils/dateFormat'

const requestTypeOptions = [
  'ACTUAL_COST',
  'ADVANCE_REQUEST',
  'REIMBURSEMENT',
  'ADDITIONAL_BUDGET',
]

const requestTypeLabels = {
  ACTUAL_COST: 'Chi phí thực tế',
  ADVANCE_REQUEST: 'Tạm ứng',
  REIMBURSEMENT: 'Hoàn ứng',
  ADDITIONAL_BUDGET: 'Bổ sung ngân sách',
  REALLOCATION_INTERNAL: 'Điều chuyển nội bộ',
  REALLOCATION_ESCALATE: 'Điều chuyển nâng cấp',
}

const statusOptions = [
  'DRAFT',
  'SUBMITTED',
  'NEED_MORE_INFO',
  'APPROVED',
  'COMMITTED',
  'PARTIALLY_PAID',
  'ESCALATED',
  'REJECTED',
  'CANCELLED',
  'PAID',
]

const statusLabels = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã gửi',
  NEED_MORE_INFO: 'Cần bổ sung',
  APPROVED: 'Đã duyệt',
  COMMITTED: 'Đã cam kết',
  PARTIALLY_PAID: 'Chi một phần',
  ESCALATED: 'Đã chuyển cấp',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  PAID: 'Đã chi',
}

const statusVariants = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  NEED_MORE_INFO: 'warning',
  APPROVED: 'success',
  COMMITTED: 'success',
  PARTIALLY_PAID: 'warning',
  ESCALATED: 'warning',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  PAID: 'success',
}

const actionConfig = {
  uploadAttachment: { label: 'Upload chứng từ', icon: Upload },
  submit: { label: 'Gửi duyệt', icon: Send },
  approve: { label: 'Phê duyệt', icon: CheckCircle2 },
  reject: { label: 'Từ chối', icon: XCircle },
  needMoreInfo: { label: 'Cần bổ sung', icon: MessageSquareMore },
  resubmit: { label: 'Gửi lại', icon: RefreshCw },
  commit: { label: 'Ghi nhận cam kết', icon: CheckCircle2 },
  escalate: { label: 'Chuyển cấp', icon: Upload },
  cancel: { label: 'Hủy', icon: Ban },
}

const financeViews = [
  {
    key: 'mine',
    title: 'My Expense Requests',
    eyebrow: 'Requester-only',
    description: 'Chỉ các yêu cầu do bạn tạo trong sự kiện này.',
    emptyTitle: 'Không có request',
    emptyDescription: 'Các nháp, yêu cầu cần bổ sung và yêu cầu đã gửi của bạn sẽ hiển thị ở đây.',
    scope: 'mine',
  },
  {
    key: 'team-review',
    title: 'Team Review Queue',
    eyebrow: 'Team-scoped',
    description: 'Hàng đợi review của Team Lead theo phạm vi task/team được backend cấp quyền.',
    emptyTitle: 'Không có yêu cầu cần team review',
    emptyDescription: 'Các request thường ở trạng thái đã gửi sẽ xuất hiện khi bạn là reviewer hợp lệ.',
    status: 'SUBMITTED',
    predicate: (request) => request.status === 'SUBMITTED' && !isEventEscalationRequest(request),
  },
  {
    key: 'event-escalation',
    title: 'Event Escalation Inbox',
    eyebrow: 'Event escalation',
    description: 'Yêu cầu bổ sung ngân sách hoặc điều chuyển liên hạng mục cần Event Lead xử lý.',
    emptyTitle: 'Không có escalation',
    emptyDescription: 'Các request thuộc Event Escalation lane sẽ xuất hiện ở đây.',
    status: 'SUBMITTED,ESCALATED',
    predicate: isEventEscalationRequest,
  },
]

const createDefaults = {
  majorTaskId: '',
  subtaskId: '',
  requestType: 'ACTUAL_COST',
  title: '',
  description: '',
  amountRequested: '',
  submitNow: false,
}

const uploadAllowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'xlsx']
const defaultPageSize = 10
const requestTypesRequiringAttachment = new Set(['ACTUAL_COST', 'REIMBURSEMENT'])

function requiresAttachment(requestType) {
  return requestTypesRequiringAttachment.has(requestType)
}

function getLongIdFromUuid(value) {
  if (typeof value !== 'string' || !value.includes('-')) return value

  const parts = value.split('-')
  if (parts.length !== 5) return value

  try {
    return BigInt(`0x${parts[3]}${parts[4]}`).toString()
  } catch {
    return value
  }
}

function toNumber(value) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  return value?.content || value?.items || []
}

function normalizeSubtask(task) {
  return {
    id: task?.id || task?.taskId,
    title: task?.title || task?.name || task?.taskName || `Task con ${task?.id || task?.taskId}`,
    status: task?.status || 'TODO',
  }
}

function normalizeExpenseRequest(request) {
  const budgetSnapshot = request?.budgetSnapshot || null
  const subtask = budgetSnapshot?.subtask
  const majorTask = budgetSnapshot?.majorTask

  return {
    id: request?.id,
    endpointId: getLongIdFromUuid(request?.id),
    status: request?.status || 'DRAFT',
    requestType: request?.requestType || 'ACTUAL_COST',
    title: request?.title || 'Yêu cầu chi phí',
    description: request?.description || '',
    amountRequested: request?.amountRequested,
    amountApproved: request?.amountApproved,
    currentVersion: request?.currentVersion,
    reviewNote: request?.reviewNote,
    requestedBy: request?.requestedBy,
    reviewedBy: request?.reviewedBy,
    sourceTaskId: getLongIdFromUuid(request?.sourceTaskId),
    targetTaskId: getLongIdFromUuid(request?.targetTaskId),
    sourceTaskName: request?.sourceTaskName,
    targetTaskName: request?.targetTaskName,
    sourceTaskBudget: request?.sourceTaskBudget,
    targetTaskBudget: request?.targetTaskBudget,
    paymentId: getLongIdFromUuid(request?.paymentId),
    allowedActions: Array.isArray(request?.allowedActions) ? request.allowedActions : [],
    reviewLane: request?.reviewLane,
    nextReviewerLabel: request?.nextReviewerLabel,
    reviewerIdentity: request?.reviewerIdentity || null,
    deniedReason: request?.deniedReason || '',
    editableAttachment: request?.editableAttachment === true,
    budgetSnapshot,
    subtaskName: subtask?.taskName,
    majorTaskName: majorTask?.taskName,
    createdAt: request?.createdAt,
    updatedAt: request?.updatedAt,
    versions: normalizeArray(request?.versions),
    attachments: normalizeArray(request?.attachments),
  }
}

function isEventEscalationRequest(request) {
  return ['ADDITIONAL_BUDGET', 'REALLOCATION_ESCALATE'].includes(request?.requestType)
    || request?.reviewLane === 'EVENT_LEAD'
    || request?.status === 'ESCALATED'
}

function getActionableButtons(request) {
  return (request?.allowedActions || []).filter((action) => action !== 'uploadAttachment')
}

function getActionSummary(request) {
  const actions = getActionableButtons(request)
  if (actions.length === 0) return 'Không có thao tác'
  return actions.map((action) => actionConfig[action]?.label || action).join(', ')
}

function getTaskContext(request) {
  return request?.subtaskName || request?.sourceTaskName || request?.majorTaskName || 'Chưa có task context'
}

function getActionDefaults(action, request) {
  if (action === 'approve') {
    return { amountApproved: request?.amountRequested || '', reviewNote: '' }
  }
  if (action === 'resubmit') {
    return {
      amountRequested: request?.amountRequested || '',
      description: request?.description || '',
      changeReason: '',
    }
  }
  if (action === 'escalate') return { escalationReason: '' }
  if (action === 'cancel') return { reason: '' }
  return { reviewNote: '' }
}

function getActionPayload(action, form) {
  if (action === 'approve') {
    return {
      amountApproved: form.amountApproved.trim(),
      reviewNote: form.reviewNote?.trim() || null,
    }
  }
  if (action === 'reject' || action === 'needMoreInfo') {
    return { reviewNote: form.reviewNote?.trim() }
  }
  if (action === 'resubmit') {
    return {
      amountRequested: form.amountRequested.trim(),
      description: form.description?.trim(),
      changeReason: form.changeReason?.trim(),
    }
  }
  if (action === 'escalate') return { escalationReason: form.escalationReason?.trim() }
  if (action === 'cancel') return { reason: form.reason?.trim() }
  return {}
}

function validateActionForm(action, form, request) {
  const errors = {}

  if (action === 'approve' && (!form.amountApproved || Number(form.amountApproved) <= 0)) {
    errors.amountApproved = 'Vui lòng nhập số tiền duyệt lớn hơn 0'
  }
  if (action === 'approve' && Number(form.amountApproved) > Number(request?.amountRequested || 0)) {
    errors.amountApproved = `Không thể duyệt vượt số tiền yêu cầu (${formatCurrency(request?.amountRequested)})`
  }
  if ((action === 'reject' || action === 'needMoreInfo') && !form.reviewNote?.trim()) {
    errors.reviewNote = 'Vui lòng nhập review note'
  }
  if (action === 'resubmit') {
    if (!form.amountRequested || Number(form.amountRequested) <= 0) errors.amountRequested = 'Vui lòng nhập số tiền lớn hơn 0'
    if (!form.description?.trim()) errors.description = 'Vui lòng nhập mô tả'
    if (!form.changeReason?.trim()) errors.changeReason = 'Vui lòng nhập lý do thay đổi'
  }
  if (action === 'escalate' && !form.escalationReason?.trim()) {
    errors.escalationReason = 'Vui lòng nhập lý do escalate'
  }
  if (action === 'cancel' && !form.reason?.trim()) {
    errors.reason = 'Vui lòng nhập lý do hủy'
  }

  return errors
}

function validateAttachment(file) {
  if (!file) return 'Vui lòng chọn file'
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!uploadAllowedExtensions.includes(extension)) return 'Chỉ hỗ trợ PDF, JPG, PNG hoặc XLSX'
  if (file.size > 10 * 1024 * 1024) return 'File tối đa 10MB'
  return ''
}

function ExpenseRequestWorkspace({ eventId, majorTasks = [], onDashboardRefresh, onError, onSuccess }) {
  const [requests, setRequests] = useState([])
  const [activeView, setActiveView] = useState('mine')
  const [filters, setFilters] = useState({ status: '', majorTaskId: '' })
  const [createForm, setCreateForm] = useState(createDefaults)
  const [createErrors, setCreateErrors] = useState({})
  const [subtasks, setSubtasks] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubtasksLoading, setIsSubtasksLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const activeViewDef = useMemo(
    () => financeViews.find((view) => view.key === activeView) || financeViews[0],
    [activeView],
  )

  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    onError(null)

    try {
      const response = await financeApi.expenseRequests.list({
        eventId,
        status: filters.status || activeViewDef.status || undefined,
        majorTaskId: filters.majorTaskId || undefined,
        scope: activeViewDef.scope,
        page: currentPage - 1,
        size: pageSize,
      })
      const normalizedRequests = (response.items || []).map(normalizeExpenseRequest)
      setRequests(normalizedRequests)
      setTotalElements(response.total || 0)
      setTotalPages(Math.max(1, response.pages || 1))
      setCurrentPage((response.currentPage ?? 0) + 1)
    } catch (err) {
      setRequests([])
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [activeViewDef.scope, activeViewDef.status, currentPage, eventId, filters.majorTaskId, filters.status, onError, pageSize])

  const loadSubtasks = useCallback(async (majorTaskId) => {
    if (!majorTaskId) {
      setSubtasks([])
      return
    }

    setIsSubtasksLoading(true)
    onError(null)

    try {
      const response = await taskApi.getSubtasks(getLongIdFromUuid(majorTaskId))
      setSubtasks(normalizeArray(response.data).map(normalizeSubtask).filter((task) => task.id))
    } catch (err) {
      setSubtasks([])
      onError(getErrorMessage(err))
    } finally {
      setIsSubtasksLoading(false)
    }
  }, [onError])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useEffect(() => {
    loadSubtasks(createForm.majorTaskId)
  }, [createForm.majorTaskId, loadSubtasks])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
    setCurrentPage(1)
  }

  function handleViewChange(nextView) {
    setActiveView(nextView)
    setFilters({ status: '', majorTaskId: '' })
    setCurrentPage(1)
  }

  function handleCreateChange(event) {
    const { name, value, type, checked } = event.target
    setCreateForm((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value }
      if (name === 'majorTaskId') next.subtaskId = ''
      if (name === 'requestType' && requiresAttachment(value)) next.submitNow = false
      return next
    })
    setCreateErrors((current) => ({ ...current, [name]: null }))
  }

  function validateCreateForm() {
    const errors = {}
    if (!createForm.majorTaskId) errors.majorTaskId = 'Vui lòng chọn task cha'
    if (!createForm.subtaskId) errors.subtaskId = 'Vui lòng chọn task con'
    if (!createForm.title.trim()) errors.title = 'Vui lòng nhập tiêu đề'
    if (!createForm.description.trim()) errors.description = 'Vui lòng nhập mô tả'
    if (!createForm.amountRequested || Number(createForm.amountRequested) <= 0) {
      errors.amountRequested = 'Vui lòng nhập số tiền lớn hơn 0'
    }
    if (createForm.submitNow && requiresAttachment(createForm.requestType)) {
      errors.submitNow = 'Loại yêu cầu này cần chứng từ. Hãy tạo nháp, tải chứng từ rồi gửi duyệt.'
    }
    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleCreateSubmit(event) {
    event.preventDefault()
    if (!validateCreateForm()) return

    setIsCreating(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await financeApi.expenseRequests.create({
        subtaskId: Number(getLongIdFromUuid(createForm.subtaskId)),
        requestType: createForm.requestType,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        amountRequested: createForm.amountRequested.trim(),
        submitNow: createForm.submitNow,
      })
      setCreateForm(createDefaults)
      setSubtasks([])
      await loadRequests()
      await onDashboardRefresh?.()
      setSelectedRequest(normalizeExpenseRequest(response))
      onSuccess(requiresAttachment(createForm.requestType)
        ? 'Đã tạo nháp. Tải chứng từ ở phần chi tiết rồi bấm Gửi duyệt.'
        : `Đã tạo yêu cầu chi phí ${response?.title || createForm.title}`)
    } catch (err) {
      setCreateErrors(getFieldErrors(err))
      onError(getErrorMessage(err))
    } finally {
      setIsCreating(false)
    }
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  async function handleOpenDetail(request) {
    setIsDetailLoading(true)
    onError(null)

    try {
      const response = await financeApi.expenseRequests.get(request.id)
      setSelectedRequest(normalizeExpenseRequest(response))
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function handleAfterMutation(nextRequest, message) {
    setSelectedRequest(nextRequest ? normalizeExpenseRequest(nextRequest) : null)
    await loadRequests()
    await onDashboardRefresh?.()
    onSuccess(message)
  }

  const visibleRequests = useMemo(() => {
    if (!activeViewDef.predicate) return requests
    return requests.filter(activeViewDef.predicate)
  }, [activeViewDef, requests])

  const requestStats = useMemo(() => {
    const counts = Object.fromEntries(statusOptions.map((status) => [status, 0]))
    visibleRequests.forEach((request) => {
      counts[request.status] = toNumber(counts[request.status]) + 1
    })
    return counts
  }, [visibleRequests])

  return (
    <section className="space-y-4">
      <Card
        title="Vòng đời yêu cầu chi phí"
        headerRight={
          <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={loadRequests}>
            Làm mới
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {['DRAFT', 'SUBMITTED', 'APPROVED', 'COMMITTED', 'PAID'].map((status) => (
            <div key={status} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs font-medium text-neutral-500">{statusLabels[status]}</p>
              <p className="mt-1 text-xl font-bold text-neutral-900">{requestStats[status] || 0}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
        <CreateExpenseRequestForm
          form={createForm}
          errors={createErrors}
          majorTasks={majorTasks}
          subtasks={subtasks}
          isSubtasksLoading={isSubtasksLoading}
          isSubmitting={isCreating}
          onChange={handleCreateChange}
          onSubmit={handleCreateSubmit}
        />

        <Card
          title={activeViewDef.title}
          headerRight={<Badge variant="default">{activeViewDef.eyebrow}</Badge>}
        >
          <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-3">
            {financeViews.map((view) => (
              <button
                key={view.key}
                type="button"
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  activeView === view.key
                    ? 'border-primary bg-primary-bg text-primary'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary/40'
                }`}
                onClick={() => handleViewChange(view.key)}
              >
                <span className="block text-sm font-semibold">{view.title}</span>
                <span className="mt-1 block text-xs">{view.eyebrow}</span>
              </button>
            ))}
          </div>

          <div className="mb-4 rounded-lg border border-info/20 bg-info-bg p-3 text-sm leading-6 text-info">
            {activeViewDef.description} Chỉ các thao tác hợp lệ cho tài khoản hiện tại được hiển thị.
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <FormField label="Trạng thái">
              <Select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">{activeViewDef.status ? `Mặc định: ${activeViewDef.status}` : 'Tất cả trạng thái'}</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]} ({status})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Task cha">
              <Select name="majorTaskId" value={filters.majorTaskId} onChange={handleFilterChange}>
                <option value="">Tất cả task cha</option>
                {majorTasks.map((task) => (
                  <option key={task.taskId} value={task.taskId}>
                    {task.taskName}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex items-end">
              <Button type="button" variant="secondary" leftIcon={<Filter size={16} />} onClick={loadRequests}>
                Lọc
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : visibleRequests.length === 0 ? (
            <EmptyState
              icon={<FileText size={24} />}
              title={activeViewDef.emptyTitle}
              description={activeViewDef.emptyDescription}
            />
          ) : (
            <div className="space-y-3">
              {visibleRequests.map((request) => (
                <ExpenseRequestRow key={request.id} request={request} onOpen={handleOpenDetail} />
              ))}
            </div>
          )}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
          <p className="mt-3 text-xs text-neutral-500">
            Tổng cộng {visibleRequests.length}/{totalElements} yêu cầu theo view và bộ lọc hiện tại.
          </p>
        </Card>
      </div>

      <ExpenseRequestDetailPanel
        request={selectedRequest}
        isLoading={isDetailLoading}
        onClose={() => setSelectedRequest(null)}
        onAfterMutation={handleAfterMutation}
        onError={onError}
      />
    </section>
  )
}

function CreateExpenseRequestForm({ form, errors, majorTasks, subtasks, isSubtasksLoading, isSubmitting, onChange, onSubmit }) {
  return (
    <Card title="Tạo yêu cầu chi phí">
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label="Task cha" required error={errors.majorTaskId}>
          <Select name="majorTaskId" value={form.majorTaskId} onChange={onChange} error={errors.majorTaskId}>
            <option value="">Chọn task cha</option>
            {majorTasks.map((task) => (
              <option key={task.taskId} value={task.taskId}>
                {task.taskName}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Task con" required error={errors.subtaskId}>
          <Select
            name="subtaskId"
            value={form.subtaskId}
            onChange={onChange}
            error={errors.subtaskId}
            disabled={!form.majorTaskId || isSubtasksLoading}
          >
            <option value="">
              {!form.majorTaskId
                ? 'Chọn task cha trước'
                : isSubtasksLoading
                  ? 'Đang tải task con...'
                  : subtasks.length === 0
                    ? 'Task cha chưa có task con'
                    : 'Chọn task con'}
            </option>
            {subtasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.status})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Loại yêu cầu">
          <Select name="requestType" value={form.requestType} onChange={onChange}>
            {requestTypeOptions.map((type) => (
              <option key={type} value={type}>
                {requestTypeLabels[type]} ({type})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Tiêu đề" required error={errors.title}>
          <Input name="title" value={form.title} onChange={onChange} error={errors.title} placeholder="Thanh toán chi phí in ấn" maxLength={200} />
        </FormField>
        <FormField label="Mô tả" required error={errors.description}>
          <Textarea
            name="description"
            value={form.description}
            onChange={onChange}
            error={errors.description}
            placeholder="Mô tả mục chi, lý do phát sinh và phạm vi sử dụng."
          />
        </FormField>
        <FormField label="Số tiền yêu cầu" required error={errors.amountRequested}>
          <Input
            type="number"
            min="1"
            step="1"
            name="amountRequested"
            value={form.amountRequested}
            onChange={onChange}
            error={errors.amountRequested}
            placeholder="3000000"
          />
        </FormField>
        {requiresAttachment(form.requestType) ? (
          <p className="rounded-lg border border-info/20 bg-info-bg p-3 text-sm leading-6 text-info">
            Loại yêu cầu này bắt buộc có chứng từ. Tạo nháp trước, tải file trong phần chi tiết, sau đó gửi duyệt.
          </p>
        ) : null}
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
            type="checkbox"
            name="submitNow"
            checked={form.submitNow}
            onChange={onChange}
            disabled={requiresAttachment(form.requestType)}
          />
          Gửi duyệt ngay sau khi tạo
        </label>
        {errors.submitNow ? <p className="text-sm text-danger">{errors.submitNow}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} leftIcon={<Plus size={16} />} disabled={majorTasks.length === 0}>
            Tạo yêu cầu
          </Button>
        </div>
      </form>
    </Card>
  )
}

function ExpenseRequestRow({ request, onOpen }) {
  const budgetTask = request.budgetSnapshot?.subtask || request.budgetSnapshot?.majorTask || request.budgetSnapshot?.sourceTask
  const availableActions = getActionableButtons(request)

  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-neutral-900">{request.title}</h3>
            <Badge variant={statusVariants[request.status] || 'default'}>{statusLabels[request.status] || request.status}</Badge>
            <Badge variant="default">{requestTypeLabels[request.requestType] || request.requestType}</Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">{request.description || 'Chưa có mô tả'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
            <span>Task: {getTaskContext(request)}</span>
            <span>Lane: {request.reviewLane || 'N/A'}</span>
            <span>Tạo lúc {formatDateTime(request.createdAt)}</span>
            <span>Version {request.currentVersion || 1}</span>
          </div>
          {request.deniedReason ? (
            <p className="mt-3 rounded-lg border border-danger/20 bg-danger-bg p-2 text-sm text-danger">
              Lý do từ chối/hủy: {request.deniedReason}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <QueueMetric label="Budget khả dụng" value={formatCurrency(budgetTask?.availableBudget)} />
            <QueueMetric label="Sau yêu cầu" value={formatCurrency(Number(budgetTask?.availableBudget || 0) - Number(request.amountRequested || 0))} />
            <QueueMetric label="Actions" value={getActionSummary(request)} tone={availableActions.length === 0 ? 'muted' : 'default'} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-lg bg-neutral-50 px-3 py-2 text-right">
            <p className="text-xs text-neutral-500">Yêu cầu</p>
            <p className="font-bold text-neutral-900">{formatCurrency(request.amountRequested)}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" leftIcon={<Eye size={16} />} onClick={() => onOpen(request)}>
            Chi tiết
          </Button>
        </div>
      </div>
    </article>
  )
}

function QueueMetric({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone === 'muted' ? 'text-neutral-500' : 'text-neutral-900'}`}>{value}</p>
    </div>
  )
}

function ExpenseRequestDetailPanel({ request, isLoading, onClose, onAfterMutation, onError }) {
  const [activeAction, setActiveAction] = useState('')
  const [actionForm, setActionForm] = useState({})
  const [actionErrors, setActionErrors] = useState({})
  const [isMutating, setIsMutating] = useState(false)
  const [pendingQuickAction, setPendingQuickAction] = useState('')
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [attachmentLabel, setAttachmentLabel] = useState('')
  const [attachmentError, setAttachmentError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setActiveAction('')
    setActionForm({})
    setActionErrors({})
    setPendingQuickAction('')
    setAttachmentFile(null)
    setAttachmentLabel('')
    setAttachmentError('')
  }, [request?.id])

  if (!request && !isLoading) return null

  const availableActions = getActionableButtons(request)

  function startAction(action) {
    if (action === 'submit' || action === 'commit') {
      setPendingQuickAction(action)
      return
    }
    setActiveAction(action)
    setActionForm(getActionDefaults(action, request))
    setActionErrors({})
  }

  function handleActionChange(event) {
    const { name, value } = event.target
    setActionForm((current) => ({ ...current, [name]: value }))
    setActionErrors((current) => ({ ...current, [name]: null }))
  }

  async function executeAction(action, payload = {}) {
    if (!request?.id) return

    setIsMutating(true)
    onError(null)

    try {
      const apiMethod = financeApi.expenseRequests[action]
      const response = await apiMethod(request.id, payload)
      setActiveAction('')
      setPendingQuickAction('')
      await onAfterMutation(response, `Đã cập nhật yêu cầu: ${actionConfig[action]?.label || action}`)
    } catch (err) {
      setActionErrors(getFieldErrors(err))
      onError(getErrorMessage(err))
    } finally {
      setIsMutating(false)
    }
  }

  async function handleActionSubmit(event) {
    event.preventDefault()
    const errors = validateActionForm(activeAction, actionForm, request)
    setActionErrors(errors)
    if (Object.keys(errors).length > 0) return
    await executeAction(activeAction, getActionPayload(activeAction, actionForm))
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null
    setAttachmentFile(file)
    setAttachmentError(validateAttachment(file))
  }

  async function handleAttachmentUpload(event) {
    event.preventDefault()
    const validationError = validateAttachment(attachmentFile)
    setAttachmentError(validationError)
    if (validationError || !request?.id) return

    setIsUploading(true)
    onError(null)

    try {
      await financeApi.expenseRequests.uploadAttachment(request.id, attachmentFile, attachmentLabel.trim() || undefined)
      const nextRequest = await financeApi.expenseRequests.get(request.id)
      setAttachmentFile(null)
      setAttachmentLabel('')
      setAttachmentError('')
      await onAfterMutation(nextRequest, 'Đã tải lên chứng từ')
    } catch (err) {
      setAttachmentError(getErrorMessage(err))
      onError(getErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/35 p-3" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Chi tiết yêu cầu chi phí</p>
            <h2 className="mt-1 truncate text-xl font-bold text-neutral-900">{request?.title || 'Đang tải...'}</h2>
          </div>
          <button type="button" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" onClick={onClose} aria-label="Đóng chi tiết">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariants[request.status] || 'default'}>{statusLabels[request.status] || request.status}</Badge>
                  <Badge variant="default">{requestTypeLabels[request.requestType] || request.requestType}</Badge>
                  <Badge variant="default">Version {request.currentVersion || 1}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-700">{request.description || 'Chưa có mô tả'}</p>
                {request.nextReviewerLabel ? (
                  <p className="mt-3 rounded-lg bg-info-bg p-3 text-sm text-info">Bước tiếp theo: {request.nextReviewerLabel} review yêu cầu này.</p>
                ) : null}
                {request.deniedReason ? (
                  <p className="mt-3 rounded-lg border border-danger/20 bg-danger-bg p-3 text-sm text-danger">
                    Lý do từ chối/hủy: {request.deniedReason}
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailMetric label="Số tiền yêu cầu" value={formatCurrency(request.amountRequested)} />
                  <DetailMetric label="Số tiền duyệt" value={formatCurrency(request.amountApproved)} />
                  <DetailMetric label="Task context" value={getTaskContext(request)} />
                  <DetailMetric label="Review lane" value={request.reviewLane || 'N/A'} />
                  <DetailMetric label="Ngày tạo" value={formatDateTime(request.createdAt)} />
                  <DetailMetric label="Cập nhật" value={formatDateTime(request.updatedAt)} />
                  {request.paymentId ? <DetailMetric label="Mã thanh toán liên quan" value={request.paymentId} /> : null}
                  {request.requestType === 'REALLOCATION_ESCALATE' ? (
                    <>
                      <DetailMetric
                        label="Task cha nguồn"
                        value={`${request.sourceTaskName || `Mã ${request.sourceTaskId || 'chưa có'}`} - ${formatCurrency(request.sourceTaskBudget)}`}
                      />
                      <DetailMetric
                        label="Task cha đích"
                        value={`${request.targetTaskName || `Mã ${request.targetTaskId || 'chưa có'}`} - ${formatCurrency(request.targetTaskBudget)}`}
                      />
                    </>
                  ) : null}
                </div>
                {request.reviewNote ? (
                  <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-neutral-500">Ghi chú phê duyệt</p>
                    <p className="mt-1 text-sm text-neutral-700">{request.reviewNote}</p>
                  </div>
                ) : null}
                {request.reviewerIdentity ? (
                  <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-neutral-500">Reviewer identity</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">
                      {request.reviewerIdentity.displayName || request.reviewerIdentity.email || request.reviewedBy}
                    </p>
                    {request.reviewerIdentity.email ? <p className="mt-1 text-xs text-neutral-500">{request.reviewerIdentity.email}</p> : null}
                  </div>
                ) : null}
              </div>

              <BudgetSnapshotPanel request={request} />

              <div className="rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-wrap gap-2">
                  {availableActions.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      {request.deniedReason
                        || (request.status === 'ESCALATED'
                          ? 'Yêu cầu đang chờ Event Lead khác requester duyệt hoặc từ chối. Tài khoản hiện tại không có quyền review yêu cầu chuyển cấp này.'
                          : 'Tài khoản hiện tại không có thao tác phù hợp với trạng thái yêu cầu.')}
                    </p>
                  ) : (
                    availableActions.map((action) => {
                      const Icon = actionConfig[action]?.icon || FileText
                      return (
                        <Button
                          key={action}
                          type="button"
                          variant={action === 'cancel' || action === 'reject' ? 'danger' : 'secondary'}
                          size="sm"
                          leftIcon={<Icon size={16} />}
                          onClick={() => startAction(action)}
                        >
                          {actionConfig[action]?.label || action}
                        </Button>
                      )
                    })
                  )}
                </div>
                {activeAction ? (
                  <ExpenseActionForm
                    action={activeAction}
                    form={actionForm}
                    errors={actionErrors}
                    isSubmitting={isMutating}
                    onChange={handleActionChange}
                    onCancel={() => setActiveAction('')}
                    onSubmit={handleActionSubmit}
                  />
                ) : null}
              </div>

              <AttachmentSection
                request={request}
                file={attachmentFile}
                label={attachmentLabel}
                error={attachmentError}
                isUploading={isUploading}
                onFileChange={handleFileChange}
                onLabelChange={(event) => setAttachmentLabel(event.target.value)}
                onSubmit={handleAttachmentUpload}
              />

              <VersionHistory versions={request.versions} />
            </div>
          </div>
        )}
      </aside>

      <ConfirmDialog
        open={Boolean(pendingQuickAction)}
        title="Xác nhận cập nhật"
        description={`Thực hiện thao tác ${actionConfig[pendingQuickAction]?.label || pendingQuickAction} cho yêu cầu chi phí này?`}
        loading={isMutating}
        onClose={() => setPendingQuickAction('')}
        onConfirm={() => executeAction(pendingQuickAction)}
      />
    </div>
  )
}

function DetailMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function BudgetSnapshotPanel({ request }) {
  const snapshot = request?.budgetSnapshot
  if (!snapshot) {
    return (
      <div className="rounded-lg border border-neutral-200 p-4">
        <EmptyState icon={<FileText size={24} />} title="Chưa có budget snapshot" description="Backend chưa trả snapshot ngân sách cho request này." />
      </div>
    )
  }

  const amount = Number(request.amountApproved || request.amountRequested || 0)
  const items = [
    ['Subtask', snapshot.subtask, -amount],
    ['Major task', snapshot.majorTask, -amount],
    ['Source task', snapshot.sourceTask, request.requestType === 'REALLOCATION_ESCALATE' ? -amount : null],
    ['Target task', snapshot.targetTask, request.requestType === 'REALLOCATION_ESCALATE' ? amount : null],
  ].filter(([, task]) => task)

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-neutral-900">Budget snapshot</h3>
          <p className="mt-1 text-xs text-neutral-500">Before/after dựa trên amount hiện tại của request.</p>
        </div>
        <Badge variant="default">{items.length} context</Badge>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {items.map(([label, task, delta]) => (
          <BudgetTaskSnapshot key={`${label}-${task.taskId || task.taskName}`} label={label} task={task} delta={delta} />
        ))}
      </div>
    </div>
  )
}

function BudgetTaskSnapshot({ label, task, delta }) {
  const before = Number(task.availableBudget || 0)
  const after = delta === null || delta === undefined ? null : before + delta

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
          <p className="mt-1 font-semibold text-neutral-900">{task.taskName || task.taskId || 'Task'}</p>
        </div>
        <Badge variant="default">{getLongIdFromUuid(task.taskId) || 'N/A'}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <DetailMetric label="Allocated" value={formatCurrency(task.allocatedBudget)} />
        <DetailMetric label="Committed" value={formatCurrency(task.committedAmount)} />
        <DetailMetric label="Available" value={formatCurrency(task.availableBudget)} />
      </div>
      {after !== null ? (
        <div className="mt-3 rounded-lg bg-white p-3">
          <p className="text-xs font-medium text-neutral-500">Before / after</p>
          <p className="mt-1 font-semibold text-neutral-900">
            {formatCurrency(before)} {'>'} {formatCurrency(after)}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function ExpenseActionForm({ action, form, errors, isSubmitting, onChange, onCancel, onSubmit }) {
  return (
    <form className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {action === 'approve' ? (
          <FormField label="Số tiền duyệt" required error={errors.amountApproved}>
            <Input type="number" min="1" step="1" name="amountApproved" value={form.amountApproved || ''} onChange={onChange} error={errors.amountApproved} />
          </FormField>
        ) : null}
        {action === 'resubmit' ? (
          <FormField label="Số tiền yêu cầu" required error={errors.amountRequested}>
            <Input type="number" min="1" step="1" name="amountRequested" value={form.amountRequested || ''} onChange={onChange} error={errors.amountRequested} />
          </FormField>
        ) : null}
        {['approve', 'reject', 'needMoreInfo'].includes(action) ? (
          <FormField label="Ghi chú phê duyệt" required={action !== 'approve'} error={errors.reviewNote}>
            <Textarea name="reviewNote" value={form.reviewNote || ''} onChange={onChange} error={errors.reviewNote} placeholder="Ghi chú review" />
          </FormField>
        ) : null}
        {action === 'resubmit' ? (
          <>
            <FormField label="Mô tả" required error={errors.description}>
              <Textarea name="description" value={form.description || ''} onChange={onChange} error={errors.description} />
            </FormField>
            <FormField label="Lý do thay đổi" required error={errors.changeReason}>
              <Textarea name="changeReason" value={form.changeReason || ''} onChange={onChange} error={errors.changeReason} />
            </FormField>
          </>
        ) : null}
        {action === 'escalate' ? (
          <FormField label="Lý do chuyển cấp" required error={errors.escalationReason}>
            <Textarea name="escalationReason" value={form.escalationReason || ''} onChange={onChange} error={errors.escalationReason} />
          </FormField>
        ) : null}
        {action === 'cancel' ? (
          <FormField label="Lý do hủy" required error={errors.reason}>
            <Textarea name="reason" value={form.reason || ''} onChange={onChange} error={errors.reason} />
          </FormField>
        ) : null}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting} variant={action === 'cancel' || action === 'reject' ? 'danger' : 'primary'}>
          Xác nhận
        </Button>
      </div>
    </form>
  )
}

function AttachmentSection({ request, file, label, error, isUploading, onFileChange, onLabelChange, onSubmit }) {
  const canUpload = request.editableAttachment === true && request.allowedActions.includes('uploadAttachment')

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-neutral-900">Attachments</h3>
          <p className="mt-1 text-xs text-neutral-500">PDF, JPG, PNG, XLSX. Tối đa 10MB.</p>
        </div>
        <Badge variant="default">{request.attachments.length}</Badge>
      </div>

      {canUpload ? (
        <form className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit} noValidate>
          <FormField label="File" error={error}>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx" onChange={onFileChange} error={error} />
          </FormField>
          <FormField label="Label">
            <Input value={label} onChange={onLabelChange} placeholder="Hóa đơn, báo giá..." />
          </FormField>
          <div className="flex items-end">
            <Button type="submit" loading={isUploading} leftIcon={<Upload size={16} />} disabled={!file}>
              Upload
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
          Attachment đang ở chế độ chỉ đọc cho tài khoản hoặc trạng thái hiện tại.
        </p>
      )}

      {request.attachments.length === 0 ? (
        <EmptyState icon={<Paperclip size={24} />} title="Chưa có attachment" description="Attachment sẽ hiển thị tại đây sau khi upload." />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {request.attachments.map((attachment) => (
            <div key={attachment.id || attachment.filename} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="truncate text-sm font-semibold text-neutral-900">{attachment.filename || 'Attachment'}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {attachment.fileType || 'FILE'} · {attachment.sizeKb || 0} KB · {formatDateTime(attachment.uploadedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VersionHistory({ versions }) {
  if (!versions || versions.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 p-4">
        <EmptyState
          icon={<RefreshCw size={24} />}
          title="Chưa có version history"
          description="Backend chưa trả lịch sử version cho yêu cầu này hoặc yêu cầu chưa từng được resubmit."
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <h3 className="font-semibold text-neutral-900">Version history</h3>
      <div className="mt-3 space-y-2">
        {versions.map((version) => (
          <div key={version.id || version.version || version.createdAt} className="rounded-lg bg-neutral-50 p-3">
            <p className="text-sm font-semibold text-neutral-900">Version {version.version || version.versionNumber || 'N/A'}</p>
            <p className="mt-1 text-xs text-neutral-500">{formatDateTime(version.createdAt || version.updatedAt)}</p>
            {version.changeReason ? <p className="mt-2 text-sm text-neutral-600">{version.changeReason}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExpenseRequestWorkspace
