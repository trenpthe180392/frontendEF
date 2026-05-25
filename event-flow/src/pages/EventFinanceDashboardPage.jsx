import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, FileText, Plus, RefreshCw, Send, ShieldCheck, Wallet, XCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { financeApi, taskApi, teamApi, teamMemberApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import ExpenseRequestWorkspace from '../features/finance/ExpenseRequestWorkspace'
import FinanceOperationsPanel from '../features/finance/FinanceOperationsPanel'
import { normalizeTeamMember } from '../features/teams/teamPageUtils'
import { getErrorMessage, getFieldErrors } from '../utils'
import { formatCurrency, formatDateTime } from '../utils/dateFormat'

const submitBudgetDefaults = {
  totalEstimatedBudget: '',
  justification: '',
  supportingDocumentId: '',
}

const approveBudgetDefaults = {
  approvedBudget: '',
  reviewNote: '',
}

const majorTaskDefaults = {
  allocationMode: 'existing',
  existingTaskId: '',
  taskName: '',
  description: '',
  estimatedBudget: '',
  teamId: '',
  teamLeaderId: '',
}

const requestStatusLabels = {
  submitted: 'Đã gửi',
  approved: 'Đã duyệt',
  paid: 'Đã chi',
  rejected: 'Từ chối',
}

const requestStatusVariants = {
  submitted: 'info',
  approved: 'success',
  paid: 'success',
  rejected: 'danger',
}

function toNumber(value) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getArray(value) {
  return Array.isArray(value) ? value : []
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

function getPageContent(value) {
  if (Array.isArray(value)) return value
  return value?.content || value?.items || []
}

function normalizeTeamOptions(data) {
  return getPageContent(data)
    .map((team) => ({
      id: team?.id || team?.teamId,
      name: team?.name || team?.teamName || `Đội nhóm ${team?.id || team?.teamId}`,
      status: team?.status,
    }))
    .filter((team) => team.id)
}

function normalizeRequestCounts(counts = {}) {
  return Object.keys(requestStatusLabels).reduce((normalized, key) => {
    normalized[key] = toNumber(counts?.[key])
    return normalized
  }, {})
}

function aggregateRequestCounts(majorTasks) {
  return majorTasks.reduce(
    (totals, task) => {
      Object.keys(requestStatusLabels).forEach((key) => {
        totals[key] += toNumber(task.requestCounts?.[key])
      })
      return totals
    },
    normalizeRequestCounts()
  )
}

function normalizeMajorTask(task) {
  return {
    taskId: task?.taskId || task?.majorTaskId || task?.id,
    taskName: task?.taskName || task?.majorTaskName || task?.name || 'Task cha',
    approvedBudget: toNumber(task?.approvedBudget || task?.estimatedBudget || task?.allocatedBudget),
    committed: toNumber(task?.committed || task?.committedAmount),
    paid: toNumber(task?.paid || task?.paidAmount),
    remaining: toNumber(task?.remaining || task?.remainingBudget),
    requestCounts: normalizeRequestCounts(task?.requestCounts),
  }
}

function normalizeDashboard(data, eventId) {
  const majorTasks = getArray(data?.majorTasks || data?.majorTaskSummaries || data?.majorTaskFinanceSummaries)
    .map(normalizeMajorTask)

  return {
    eventId: data?.eventId || eventId,
    totalApprovedBudget: toNumber(data?.totalApprovedBudget || data?.approvedBudget || data?.totalBudget),
    totalAllocated: toNumber(data?.totalAllocated || data?.allocatedBudget),
    totalCommitted: toNumber(data?.totalCommitted || data?.committedAmount),
    totalPaid: toNumber(data?.totalPaid || data?.paidAmount),
    totalRemaining: toNumber(data?.totalRemaining || data?.remainingBudget),
    burnRatePercent: toNumber(data?.burnRatePercent),
    budgetApproval: data?.budgetApproval || null,
    capabilities: data?.capabilities || {},
    majorTasks,
    requestCounts: aggregateRequestCounts(majorTasks),
    recentExpenseRequests: getArray(data?.recentExpenseRequests || data?.recentRequests || data?.expenseRequests).slice(0, 5),
  }
}

function formatMoney(value) {
  return formatCurrency(toNumber(value))
}

function formatPercent(value) {
  return `${toNumber(value).toFixed(1).replace('.0', '')}%`
}

function getFinanceDataState(dashboard) {
  if (!dashboard) return false

  const monetaryTotal =
    dashboard.totalApprovedBudget +
    dashboard.totalAllocated +
    dashboard.totalCommitted +
    dashboard.totalPaid +
    dashboard.totalRemaining
  const countTotal = Object.values(dashboard.requestCounts || {}).reduce((total, value) => total + toNumber(value), 0)

  return monetaryTotal > 0 || countTotal > 0 || dashboard.majorTasks.length > 0 || dashboard.recentExpenseRequests.length > 0
}

function EventFinanceDashboardContent({ eventDetail, organizationId, eventId, onError, onSuccess }) {
  const [dashboard, setDashboard] = useState(null)
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTeamsLoading, setIsTeamsLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    onError(null)

    try {
      const data = await financeApi.dashboard.getByEvent(eventId)
      setDashboard(normalizeDashboard(data, eventId))
    } catch (err) {
      setDashboard(null)
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [eventId, onError])

  const loadTeams = useCallback(async () => {
    setIsTeamsLoading(true)

    try {
      const response = await teamApi.getByEvent(eventId, { page: 0, size: 100 })
      setTeams(normalizeTeamOptions(response.data))
    } catch (err) {
      setTeams([])
      onError(getErrorMessage(err))
    } finally {
      setIsTeamsLoading(false)
    }
  }, [eventId, onError])

  useEffect(() => {
    loadDashboard()
    loadTeams()
  }, [loadDashboard, loadTeams])

  const hasFinanceData = getFinanceDataState(dashboard)
  const totalRequests = useMemo(
    () => Object.values(dashboard?.requestCounts || {}).reduce((total, value) => total + toNumber(value), 0),
    [dashboard]
  )
  const hasApprovedBudget = toNumber(dashboard?.totalApprovedBudget) > 0

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[280px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Tài chính sự kiện"
        description="Theo dõi ngân sách được duyệt, khoản đã cam kết, khoản đã chi và trạng thái yêu cầu chi phí của sự kiện."
        icon={<Wallet size={24} />}
        actions={
          <Button variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={loadDashboard}>
            Làm mới
          </Button>
        }
        stats={[
          { label: 'Ngân sách duyệt', value: formatMoney(dashboard?.totalApprovedBudget) },
          { label: 'Đã cam kết', value: formatMoney(dashboard?.totalCommitted) },
          { label: 'Đã chi', value: formatMoney(dashboard?.totalPaid) },
          { label: 'Tỷ lệ cam kết', value: formatPercent(dashboard?.burnRatePercent) },
        ]}
      />

      <FinanceWorkflowStatus
        estimatedBudget={eventDetail?.estimatedBudget}
        approvedBudget={dashboard?.totalApprovedBudget}
        allocatedBudget={dashboard?.totalAllocated}
        totalRequests={totalRequests}
      />

      <FinanceBudgetActions
        eventId={eventId}
        estimatedBudget={eventDetail?.estimatedBudget}
        approvedBudget={dashboard?.totalApprovedBudget}
        allocatedBudget={dashboard?.totalAllocated}
        majorTasks={dashboard?.majorTasks || []}
        budgetApproval={dashboard?.budgetApproval}
        capabilities={dashboard?.capabilities}
        hasApprovedBudget={hasApprovedBudget}
        teams={teams}
        isTeamsLoading={isTeamsLoading}
        onRefresh={loadDashboard}
        onError={onError}
        onSuccess={onSuccess}
      />

      {!hasFinanceData ? (
        <Card>
          <EmptyState
            icon={<Wallet size={24} />}
            title="Chưa có dữ liệu tài chính"
            description="Khi ngân sách task cha hoặc yêu cầu chi phí được tạo, dashboard sẽ hiển thị số liệu tại đây."
          />
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <FinanceMetricCard label="Ngân sách đã duyệt" value={formatMoney(dashboard?.totalApprovedBudget)} hint="Trần chi tiêu của sự kiện sau phê duyệt." />
        <FinanceMetricCard label="Đã phân bổ" value={formatMoney(dashboard?.totalAllocated)} hint="Tổng ngân sách cấp cho các hạng mục." />
        <FinanceMetricCard label="Đã cam kết" value={formatMoney(dashboard?.totalCommitted)} hint="Khoản đã duyệt hoặc đã thanh toán." />
        <FinanceMetricCard label="Chưa phân bổ" value={formatMoney(dashboard?.totalRemaining)} hint="Ngân sách duyệt còn có thể cấp cho hạng mục." />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <MajorTaskFinanceSummary organizationId={organizationId} eventId={eventId} majorTasks={dashboard?.majorTasks || []} />
        <RequestStatusSummary counts={dashboard?.requestCounts || normalizeRequestCounts()} totalRequests={totalRequests} />
      </div>

      <ExpenseRequestWorkspace
        eventId={eventId}
        majorTasks={dashboard?.majorTasks || []}
        onDashboardRefresh={loadDashboard}
        onError={onError}
        onSuccess={onSuccess}
      />

      <FinanceOperationsPanel
        eventId={eventId}
        majorTasks={dashboard?.majorTasks || []}
        onDashboardRefresh={loadDashboard}
        onError={onError}
        onSuccess={onSuccess}
      />

    </div>
  )
}

function FinanceWorkflowStatus({ estimatedBudget, approvedBudget, allocatedBudget, totalRequests }) {
  const steps = [
    { label: 'Dự toán sự kiện', complete: toNumber(estimatedBudget) > 0 },
    { label: 'Duyệt ngân sách', complete: toNumber(approvedBudget) > 0 },
    { label: 'Phân bổ hạng mục', complete: toNumber(allocatedBudget) > 0 },
    { label: 'Yêu cầu chi phí', complete: totalRequests > 0 },
  ]

  return (
    <section className="flex flex-wrap items-center gap-2 border-y border-neutral-200 py-3">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2">
          <Badge variant={step.complete ? 'success' : 'default'}>{step.label}</Badge>
          {index < steps.length - 1 ? <span className="text-neutral-400">/</span> : null}
        </div>
      ))}
    </section>
  )
}

function FinanceBudgetActions({ eventId, estimatedBudget, approvedBudget, allocatedBudget, majorTasks, budgetApproval, capabilities, hasApprovedBudget, teams, isTeamsLoading, onRefresh, onError, onSuccess }) {
  const isPending = budgetApproval?.status === 'PENDING'
  const isRejected = budgetApproval?.status === 'REJECTED'
  const canSubmitBudget = capabilities?.canSubmitBudget === true
  const canApproveBudget = capabilities?.canApproveBudget === true
  const canAllocateMajorTask = capabilities?.canAllocateMajorTask === true
  const hasAllocationConflict = toNumber(allocatedBudget) > toNumber(approvedBudget)
  const availableBudget = Math.max(0, toNumber(approvedBudget) - toNumber(allocatedBudget))

  return (
    <section className="space-y-4">
      <Card title="Quy trình duyệt ngân sách">
        <p className="text-sm leading-6 text-neutral-600">
          Trưởng sự kiện lập đề xuất. Chủ workspace hoặc quản trị viên review yêu cầu đang chờ và xác lập trần chi tiêu. Chỉ sau khi được duyệt, trưởng sự kiện mới phân bổ ngân sách cho task cha.
        </p>
      </Card>

      {hasAllocationConflict ? (
        <Card title="Cần điều chỉnh trần ngân sách">
          <div className="rounded-lg border border-warning/20 bg-warning-bg p-3 text-sm leading-6 text-warning">
            Đã phân bổ {formatMoney(allocatedBudget)}, vượt trần đã duyệt {formatMoney(approvedBudget)}. Tạm dừng phân bổ mới và gửi đề nghị điều chỉnh tối thiểu {formatMoney(allocatedBudget)}.
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {!isPending && canSubmitBudget ? (
          <SubmitBudgetForm
            eventId={eventId}
            estimatedBudget={estimatedBudget}
            minimumBudget={hasApprovedBudget ? allocatedBudget : 0}
            isRevision={hasApprovedBudget}
            onRefresh={onRefresh}
            onError={onError}
            onSuccess={onSuccess}
          />
        ) : null}
        {isPending ? <PendingBudgetApproval approval={budgetApproval} /> : null}
        {isRejected ? <RejectedBudgetApproval approval={budgetApproval} /> : null}
        {isPending && canApproveBudget ? <ApproveBudgetForm eventId={eventId} approval={budgetApproval} minimumBudget={allocatedBudget} onRefresh={onRefresh} onError={onError} onSuccess={onSuccess} /> : null}
        {hasApprovedBudget ? <ApprovedBudgetSummary approval={budgetApproval?.status === 'APPROVED' ? budgetApproval : null} approvedBudget={approvedBudget} /> : null}
      </div>

      {hasApprovedBudget && canAllocateMajorTask && !hasAllocationConflict ? (
        <MajorTaskCreateForm
          eventId={eventId}
          hasApprovedBudget={hasApprovedBudget}
          availableBudget={availableBudget}
          allocatedMajorTasks={majorTasks}
          teams={teams}
          isTeamsLoading={isTeamsLoading}
          onRefresh={onRefresh}
          onError={onError}
          onSuccess={onSuccess}
        />
      ) : null}
    </section>
  )
}

function PendingBudgetApproval({ approval }) {
  return (
    <Card title="Yêu cầu đang chờ phê duyệt">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="warning">Chờ Chủ workspace / Quản trị viên</Badge>
          <span className="font-semibold text-neutral-700">#{approval.requestId}</span>
        </div>
        <p className="text-2xl font-bold text-neutral-900">{formatMoney(approval.requestedBudget)}</p>
        <p className="leading-6 text-neutral-600">{approval.justification}</p>
        <p className="text-neutral-500">Gửi lúc: {formatDateTime(approval.submittedAt)}</p>
        {approval.supportingDocumentId ? <p className="text-neutral-500">Chứng từ: {approval.supportingDocumentId}</p> : null}
      </div>
    </Card>
  )
}

function RejectedBudgetApproval({ approval }) {
  return (
    <Card title="Đề nghị đã bị từ chối">
      <div className="space-y-3 text-sm">
        <Badge variant="danger">Cần chỉnh sửa và gửi lại</Badge>
        <p className="text-2xl font-bold text-neutral-900">{formatMoney(approval.requestedBudget)}</p>
        {approval.reviewNote ? <p className="rounded-lg bg-danger-bg p-3 text-danger">{approval.reviewNote}</p> : null}
        <p className="text-neutral-500">Review lúc: {formatDateTime(approval.reviewedAt)}</p>
      </div>
    </Card>
  )
}

function ApprovedBudgetSummary({ approval, approvedBudget }) {
  return (
    <Card title="Kết quả phê duyệt">
      <div className="space-y-3 text-sm">
        <Badge variant="success">Ngân sách đã được duyệt</Badge>
        <p className="text-2xl font-bold text-neutral-900">{formatMoney(approvedBudget)}</p>
        <p className="text-neutral-600">Trần ngân sách đã được khóa; điều chỉnh tiếp theo phải đi qua yêu cầu tài chính.</p>
        {approval?.reviewNote ? <p className="rounded-lg bg-neutral-50 p-3 text-neutral-600">{approval.reviewNote}</p> : null}
        {approval?.reviewedAt ? <p className="text-neutral-500">Duyệt lúc: {formatDateTime(approval.reviewedAt)}</p> : null}
      </div>
    </Card>
  )
}

function SubmitBudgetForm({ eventId, estimatedBudget, minimumBudget = 0, isRevision = false, onRefresh, onError, onSuccess }) {
  const [form, setForm] = useState(submitBudgetDefaults)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const suggestedBudget = Math.max(toNumber(estimatedBudget), toNumber(minimumBudget))
    if (!suggestedBudget) return
    setForm((current) => current.totalEstimatedBudget
      ? current
      : { ...current, totalEstimatedBudget: String(suggestedBudget) })
  }, [estimatedBudget, minimumBudget])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.totalEstimatedBudget || Number(form.totalEstimatedBudget) <= 0) {
      nextErrors.totalEstimatedBudget = 'Vui lòng nhập ngân sách dự kiến lớn hơn 0'
    }
    if (Number(form.totalEstimatedBudget) < toNumber(minimumBudget)) {
      nextErrors.totalEstimatedBudget = `Ngân sách đề nghị không thể thấp hơn phần đã phân bổ (${formatMoney(minimumBudget)})`
    }
    if (!form.justification.trim()) nextErrors.justification = 'Vui lòng nhập lý do trình duyệt ngân sách'
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
      const response = await financeApi.budget.submitForApproval(eventId, {
        totalEstimatedBudget: form.totalEstimatedBudget.trim(),
        justification: form.justification.trim(),
        supportingDocumentId: form.supportingDocumentId.trim() || null,
      })
      setForm(submitBudgetDefaults)
      await onRefresh()
      onSuccess(`Đã trình ngân sách ${formatMoney(response?.totalEstimatedBudget || form.totalEstimatedBudget)} để phê duyệt`)
    } catch (err) {
      setErrors(getFieldErrors(err))
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card title={isRevision ? 'Đề nghị điều chỉnh ngân sách' : 'Gửi duyệt ngân sách'}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info-bg p-3 text-sm text-info">
          <Send size={18} className="mt-0.5 shrink-0" />
          <p>{isRevision ? 'Trần hiện tại chỉ thay đổi sau khi chủ workspace hoặc quản trị viên duyệt đề nghị điều chỉnh.' : 'Dự toán từ thông tin sự kiện là đề xuất ban đầu trước khi được finance phê duyệt.'}</p>
        </div>
        <FormField label="Dự toán đề xuất" required error={errors.totalEstimatedBudget}>
          <Input
            type="number"
            min={Math.max(1, toNumber(minimumBudget))}
            step="1"
            name="totalEstimatedBudget"
            value={form.totalEstimatedBudget}
            onChange={handleChange}
            error={errors.totalEstimatedBudget}
            placeholder="50000000"
          />
        </FormField>
        <FormField label="Cơ sở dự toán" required error={errors.justification}>
          <Textarea
            name="justification"
            value={form.justification}
            onChange={handleChange}
            error={errors.justification}
            placeholder="Tóm tắt cơ sở lập ngân sách, phạm vi sử dụng và lý do cần phê duyệt."
          />
        </FormField>
        <FormField label="Mã chứng từ hỗ trợ" error={errors.supportingDocumentId}>
          <Input
            name="supportingDocumentId"
            value={form.supportingDocumentId}
            onChange={handleChange}
            error={errors.supportingDocumentId}
            placeholder="Tùy chọn"
          />
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} leftIcon={<Send size={16} />}>
            Gửi phê duyệt
          </Button>
        </div>
      </form>
    </Card>
  )
}

function ApproveBudgetForm({ eventId, approval, minimumBudget = 0, onRefresh, onError, onSuccess }) {
  const [form, setForm] = useState(approveBudgetDefaults)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  useEffect(() => {
    if (!approval?.requestedBudget) return
    setForm((current) => current.approvedBudget
      ? current
      : { ...current, approvedBudget: String(approval.requestedBudget) })
  }, [approval?.requestedBudget])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.approvedBudget || Number(form.approvedBudget) <= 0) {
      nextErrors.approvedBudget = 'Vui lòng nhập ngân sách phê duyệt lớn hơn 0'
    }
    if (Number(form.approvedBudget) > toNumber(approval?.requestedBudget)) {
      nextErrors.approvedBudget = `Không thể duyệt vượt mức đề nghị (${formatMoney(approval?.requestedBudget)})`
    }
    if (Number(form.approvedBudget) < toNumber(minimumBudget)) {
      nextErrors.approvedBudget = `Không thể duyệt thấp hơn phần đã phân bổ (${formatMoney(minimumBudget)})`
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
      const response = await financeApi.budget.approve(eventId, {
        approvedBudget: form.approvedBudget.trim(),
        reviewNote: form.reviewNote.trim() || null,
      })
      setForm(approveBudgetDefaults)
      await onRefresh()
      onSuccess(`Đã phê duyệt ngân sách ${formatMoney(response?.approvedBudget || form.approvedBudget)}`)
    } catch (err) {
      setErrors(getFieldErrors(err))
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReject() {
    if (!form.reviewNote.trim()) {
      setErrors((current) => ({ ...current, reviewNote: 'Vui lòng nhập lý do từ chối' }))
      return
    }

    setIsRejecting(true)
    onError(null)
    onSuccess(null)

    try {
      await financeApi.budget.reject(eventId, { reviewNote: form.reviewNote.trim() })
      setForm(approveBudgetDefaults)
      await onRefresh()
      onSuccess('Đã từ chối đề nghị ngân sách và gửi phản hồi cho người lập')
    } catch (err) {
      setErrors(getFieldErrors(err))
      onError(getErrorMessage(err))
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <Card title={`Review yêu cầu #${approval?.requestId || ''}`}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning-bg p-3 text-sm text-warning">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <p>Chỉ chủ workspace hoặc quản trị viên được duyệt. Mức duyệt nằm trong khoảng đã phân bổ đến mức đề nghị.</p>
        </div>
        <FormField label="Ngân sách phê duyệt" required error={errors.approvedBudget}>
          <Input
            type="number"
            min={Math.max(1, toNumber(minimumBudget))}
            step="1"
            name="approvedBudget"
            value={form.approvedBudget}
            onChange={handleChange}
            error={errors.approvedBudget}
            placeholder="45000000"
          />
        </FormField>
        <FormField label="Ghi chú phê duyệt" error={errors.reviewNote}>
          <Textarea
            name="reviewNote"
            value={form.reviewNote}
            onChange={handleChange}
            error={errors.reviewNote}
            placeholder="Ghi chú review, điều kiện duyệt hoặc lý do điều chỉnh ngân sách."
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="danger" loading={isRejecting} disabled={isSubmitting} leftIcon={<XCircle size={16} />} onClick={handleReject}>
            Từ chối
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isRejecting} leftIcon={<ShieldCheck size={16} />}>
            Phê duyệt
          </Button>
        </div>
      </form>
    </Card>
  )
}

function MajorTaskCreateForm({ eventId, hasApprovedBudget, availableBudget, allocatedMajorTasks, teams, isTeamsLoading, onRefresh, onError, onSuccess }) {
  const [form, setForm] = useState(majorTaskDefaults)
  const [operationalTasks, setOperationalTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [errors, setErrors] = useState({})
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadTeamMembers = useCallback(async (teamId) => {
    if (!teamId) {
      setTeamMembers([])
      return
    }

    setIsLoadingMembers(true)

    try {
      const response = await teamMemberApi.getByTeam(teamId, { page: 0, size: 100 })
      setTeamMembers(getPageContent(response.data).map(normalizeTeamMember))
    } catch (err) {
      setTeamMembers([])
      onError(getErrorMessage(err))
    } finally {
      setIsLoadingMembers(false)
    }
  }, [onError])

  useEffect(() => {
    loadTeamMembers(form.teamId)
  }, [form.teamId, loadTeamMembers])

  useEffect(() => {
    async function loadOperationalTasks() {
      try {
        const response = await taskApi.getByEvent(eventId, { page: 0, size: 100 })
        const items = getPageContent(response.data)
        setOperationalTasks(items.filter((task) => task.parentTaskId == null && task.financeRole === 'OPERATIONAL_TASK'))
      } catch (err) {
        setOperationalTasks([])
        onError(getErrorMessage(err))
      }
    }
    loadOperationalTasks()
  }, [eventId, onError])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'teamId') next.teamLeaderId = ''
      return next
    })
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function validateForm() {
    const nextErrors = {}
    if (form.allocationMode === 'existing' && !form.existingTaskId) nextErrors.existingTaskId = 'Vui lòng chọn task cha đã có'
    if (form.allocationMode === 'new' && !form.taskName.trim()) nextErrors.taskName = 'Vui lòng nhập tên task cha'
    if (!form.estimatedBudget || Number(form.estimatedBudget) <= 0) {
      nextErrors.estimatedBudget = 'Vui lòng nhập ngân sách task cha lớn hơn 0'
    }
    if (Number(form.estimatedBudget) > toNumber(availableBudget)) {
      nextErrors.estimatedBudget = `Chỉ còn có thể phân bổ ${formatMoney(availableBudget)}`
    }
    if (form.allocationMode === 'new' && !form.teamId) nextErrors.teamId = 'Vui lòng chọn đội nhóm phụ trách'
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
      const response = form.allocationMode === 'existing'
        ? await financeApi.majorTasks.allocateExisting(eventId, form.existingTaskId, {
            approvedBudget: form.estimatedBudget.trim(),
            teamLeaderId: null,
          })
        : await financeApi.majorTasks.create(eventId, {
            taskName: form.taskName.trim(),
            description: form.description.trim() || null,
            estimatedBudget: form.estimatedBudget.trim(),
            teamLeaderId: form.teamLeaderId ? Number(form.teamLeaderId) : null,
            teamId: Number(form.teamId),
          })
      setForm(majorTaskDefaults)
      setTeamMembers([])
      await onRefresh()
      onSuccess(`Đã cấp ngân sách cho task cha ${response?.title || form.taskName}`)
    } catch (err) {
      setErrors(getFieldErrors(err))
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card title="Phân bổ ngân sách cho task cha">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
          <FileText size={18} className="mt-0.5 shrink-0 text-primary" />
          <p>Task cha là hạng mục ngân sách và cũng xuất hiện trong trang Công việc. Task con thuộc đúng đội của task cha và là nơi lập yêu cầu chi phí.</p>
        </div>
        <p className="rounded-lg border border-info/20 bg-info-bg p-3 text-sm text-info">
          Ngân sách còn có thể phân bổ: <strong>{formatMoney(availableBudget)}</strong>
        </p>
        {allocatedMajorTasks.length > 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-800">Task cha đã được cấp ngân sách</p>
            <p className="mt-1 text-xs">Các task này dùng để tạo task con và yêu cầu chi phí, nên không xuất hiện ở danh sách cấp mới.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {allocatedMajorTasks.map((task) => (
                <Badge key={task.taskId} variant="success">{task.taskName} - {formatMoney(task.approvedBudget)}</Badge>
              ))}
            </div>
          </div>
        ) : null}
        {!hasApprovedBudget ? (
          <p className="rounded-lg border border-warning/20 bg-warning-bg p-3 text-sm font-medium text-warning">
            Cần phê duyệt ngân sách sự kiện trước khi phân bổ cho hạng mục.
          </p>
        ) : null}
        <FormField label="Cách phân bổ">
          <Select name="allocationMode" value={form.allocationMode} onChange={handleChange}>
            <option value="existing">Cấp ngân sách cho task cha đã có</option>
            <option value="new">Tạo task cha mới và cấp ngân sách</option>
          </Select>
        </FormField>
        {form.allocationMode === 'existing' ? (
            <FormField label="Công việc gốc chưa có ngân sách" required error={errors.existingTaskId}>
            <Select name="existingTaskId" value={form.existingTaskId} onChange={handleChange} error={errors.existingTaskId}>
              <option value="">Chọn công việc để chuyển thành task cha ngân sách</option>
              {operationalTasks.map((task) => (
                <option key={task.id || task.taskId} value={task.id || task.taskId}>{task.title || task.taskName}</option>
              ))}
            </Select>
          </FormField>
        ) : (
        <>
        <FormField label="Tên hạng mục / task cha" required error={errors.taskName}>
          <Input name="taskName" value={form.taskName} onChange={handleChange} error={errors.taskName} placeholder="Sân khấu và âm thanh" />
        </FormField>
        <FormField label="Mô tả" error={errors.description}>
          <Textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            error={errors.description}
            placeholder="Phạm vi công việc, deliverable và ghi chú triển khai."
          />
        </FormField>
        <FormField label="Đội nhóm phụ trách" required error={errors.teamId}>
          <Select name="teamId" value={form.teamId} onChange={handleChange} error={errors.teamId} disabled={isTeamsLoading}>
            <option value="">{isTeamsLoading ? 'Đang tải đội nhóm...' : 'Chọn đội nhóm'}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Trưởng đội review chi phí" error={errors.teamLeaderId}>
          <Select
            name="teamLeaderId"
            value={form.teamLeaderId}
            onChange={handleChange}
            error={errors.teamLeaderId}
            disabled={!form.teamId || isLoadingMembers}
          >
            <option value="">
              {!form.teamId ? 'Chọn đội nhóm trước' : isLoadingMembers ? 'Đang tải thành viên...' : 'Không chỉ định'}
            </option>
            {teamMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.userName} - {member.role} - ID {member.userId}
              </option>
            ))}
          </Select>
        </FormField>
        </>
        )}
        <FormField label="Ngân sách phân bổ" required error={errors.estimatedBudget}>
          <Input
            type="number"
            min="1"
            step="1"
            name="estimatedBudget"
            value={form.estimatedBudget}
            onChange={handleChange}
            error={errors.estimatedBudget}
            placeholder="10000000"
          />
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} leftIcon={<Plus size={16} />} disabled={!hasApprovedBudget || (form.allocationMode === 'new' && teams.length === 0)}>
            {form.allocationMode === 'existing' ? 'Cấp ngân sách' : 'Tạo task cha và phân bổ'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function FinanceMetricCard({ label, value, hint }) {
  return (
    <Card>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="text-sm leading-6 text-neutral-500">{hint}</p>
      </div>
    </Card>
  )
}

function MajorTaskFinanceSummary({ organizationId, eventId, majorTasks }) {
  const navigate = useNavigate()

  return (
    <Card title="Ngân sách theo hạng mục">
      {majorTasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Chưa có hạng mục được phân bổ"
          description="Hạng mục được hiển thị sau khi nhận ngân sách từ trần đã phê duyệt."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-3">Hạng mục</th>
                <th className="px-3 py-3 text-right">Duyệt</th>
                <th className="px-3 py-3 text-right">Cam kết</th>
                <th className="px-3 py-3 text-right">Đã chi</th>
                <th className="px-3 py-3 text-right">Còn lại</th>
                <th className="px-3 py-3">Yêu cầu</th>
                <th className="px-3 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {majorTasks.map((task) => (
                <tr key={task.taskId || task.taskName} className="align-top">
                  <td className="px-3 py-3 font-semibold text-neutral-900">{task.taskName}</td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatMoney(task.approvedBudget)}</td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatMoney(task.committed)}</td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatMoney(task.paid)}</td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatMoney(task.remaining)}</td>
                  <td className="px-3 py-3">
                    <RequestCountBadges counts={task.requestCounts} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus size={16} />}
                      onClick={() => navigate(`/organizations/${organizationId}/events/${eventId}/tasks/create?parentTaskId=${getLongIdFromUuid(task.taskId)}`)}
                    >
                      Tạo task con
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function RequestStatusSummary({ counts, totalRequests }) {
  return (
    <Card title="Trạng thái yêu cầu">
      <div className="space-y-3">
        {Object.entries(requestStatusLabels).map(([key, label]) => {
          const count = toNumber(counts[key])
          const percent = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0

          return (
            <div key={key} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <Badge variant={requestStatusVariants[key] || 'default'}>{label}</Badge>
                <span className="text-lg font-bold text-neutral-900">{count}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-neutral-500">{percent}% tổng số yêu cầu</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function RequestCountBadges({ counts }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(requestStatusLabels).map(([key, label]) => (
        <Badge key={key} variant={requestStatusVariants[key] || 'default'}>
          {label}: {toNumber(counts?.[key])}
        </Badge>
      ))}
    </div>
  )
}

function EventFinanceDashboardPage() {
  const { eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ eventDetail, organizationId }) => (
        <EventFinanceDashboardContent
          eventDetail={eventDetail}
          organizationId={organizationId}
          eventId={Number(eventId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default EventFinanceDashboardPage
