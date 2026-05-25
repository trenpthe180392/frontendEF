import { useCallback, useEffect, useState } from 'react'
import { Banknote, CheckCircle2, Download, FileDown, RefreshCw, Repeat2, Search, Send, ShieldAlert } from 'lucide-react'

import { financeApi } from '../../api'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import FormField from '../../components/form/FormField'
import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import Textarea from '../../components/ui/Textarea'
import { getErrorMessage, getFieldErrors } from '../../utils'
import { formatCurrency } from '../../utils/dateFormat'

const paymentStatusLabels = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PAID: 'Đã chi',
  CANCELLED: 'Đã hủy',
  REVERSED: 'Đã reverse',
  REFUNDED: 'Đã hoàn',
}

const paymentStatusVariants = {
  PENDING: 'warning',
  APPROVED: 'info',
  PAID: 'success',
  CANCELLED: 'danger',
  REVERSED: 'danger',
  REFUNDED: 'default',
}

const paymentActionLabels = {
  approve: 'Duyệt thanh toán',
  pay: 'Xác nhận giải ngân',
  reverse: 'Hoàn tác thanh toán',
}

const escalateDefaults = {
  sourceMajorTaskId: '',
  targetMajorTaskId: '',
  amount: '',
  reason: '',
}

const internalDefaults = {
  majorTaskId: '',
  sourceSubtaskId: '',
  targetSubtaskId: '',
  amount: '',
  reason: '',
}

const subtaskBudgetDefaults = {
  subtaskId: '',
  amount: '',
}

const payDefaults = {
  proofAttachmentId: '',
  notes: '',
}

const reverseDefaults = {
  compensationReason: '',
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

function normalizePayment(payment) {
  if (!payment) return null

  return {
    id: payment.id,
    endpointId: getLongIdFromUuid(payment.id),
    status: payment.status || 'PENDING',
    amount: payment.amount,
    expenseRequestId: payment.expenseRequestId,
    parentPaymentId: payment.parentPaymentId,
    allowedActions: Array.isArray(payment.allowedActions) ? payment.allowedActions : [],
  }
}

function normalizeSubtask(task) {
  return {
    id: task?.subtaskId || task?.id || task?.taskId,
    title: task?.title || task?.name || task?.taskName || `Task con ${task?.id || task?.taskId}`,
    allocatedBudget: task?.allocatedBudget ?? task?.approvedCost,
    committedAmount: task?.committedAmount,
    availableBudget: task?.availableBudget,
  }
}

function validatePositiveAmount(value, message) {
  const normalized = String(value || '').trim()
  if (!/^\d+$/.test(normalized) || BigInt(normalized) <= 0n) return message
  return ''
}

function FinanceOperationsPanel({ eventId, majorTasks = [], onDashboardRefresh, onError, onSuccess }) {
  const [paymentId, setPaymentId] = useState('')
  const [payment, setPayment] = useState(null)
  const [payments, setPayments] = useState([])
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false)
  const [payForm, setPayForm] = useState(payDefaults)
  const [reverseForm, setReverseForm] = useState(reverseDefaults)
  const [paymentErrors, setPaymentErrors] = useState({})
  const [pendingPaymentAction, setPendingPaymentAction] = useState(null)
  const [isPaymentMutating, setIsPaymentMutating] = useState(false)
  const [internalForm, setInternalForm] = useState(internalDefaults)
  const [internalErrors, setInternalErrors] = useState({})
  const [internalSubtasks, setInternalSubtasks] = useState([])
  const [isInternalSubtasksLoading, setIsInternalSubtasksLoading] = useState(false)
  const [subtaskBudgetForm, setSubtaskBudgetForm] = useState(subtaskBudgetDefaults)
  const [subtaskBudgetErrors, setSubtaskBudgetErrors] = useState({})
  const [isAllocatingSubtask, setIsAllocatingSubtask] = useState(false)
  const [escalateForm, setEscalateForm] = useState(escalateDefaults)
  const [escalateErrors, setEscalateErrors] = useState({})
  const [pendingReallocation, setPendingReallocation] = useState(null)
  const [isReallocating, setIsReallocating] = useState(false)
  const [lastReallocation, setLastReallocation] = useState(null)
  const [exportingFormat, setExportingFormat] = useState('')

  const loadPayments = useCallback(async () => {
    setIsPaymentsLoading(true)
    try {
      const response = await financeApi.payments.listByEvent(eventId)
      setPayments((Array.isArray(response) ? response : []).map(normalizePayment))
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsPaymentsLoading(false)
    }
  }, [eventId, onError])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  useEffect(() => {
    async function loadInternalSubtasks() {
      if (!internalForm.majorTaskId) {
        setInternalSubtasks([])
        setSubtaskBudgetForm(subtaskBudgetDefaults)
        return
      }

      setIsInternalSubtasksLoading(true)
      try {
        const response = await financeApi.reallocation.getInternalBalances(internalForm.majorTaskId)
        const content = Array.isArray(response) ? response : response?.content || response?.items || []
        setInternalSubtasks(content.map(normalizeSubtask).filter((task) => task.id))
      } catch (err) {
        setInternalSubtasks([])
        onError(getErrorMessage(err))
      } finally {
        setIsInternalSubtasksLoading(false)
      }
    }

    loadInternalSubtasks()
  }, [internalForm.majorTaskId, onError])

  async function selectPayment(selectedPayment) {
    setPaymentId(selectedPayment.endpointId || selectedPayment.id || '')
    setPayment(selectedPayment)
    setPayForm(payDefaults)
    setReverseForm(reverseDefaults)
    setPaymentErrors({})
  }

  async function handleLoadPayment(event) {
    event.preventDefault()
    if (!paymentId.trim()) {
      setPaymentErrors({ paymentId: 'Vui lòng nhập mã thanh toán' })
      return
    }

    setIsPaymentLoading(true)
    setPaymentErrors({})
    onError(null)

    try {
      const response = await financeApi.payments.get(paymentId.trim())
      setPayment(normalizePayment(response))
      setPayForm(payDefaults)
      setReverseForm(reverseDefaults)
    } catch (err) {
      setPayment(null)
      onError(getErrorMessage(err))
    } finally {
      setIsPaymentLoading(false)
    }
  }

  function handlePayChange(event) {
    const { name, value } = event.target
    setPayForm((current) => ({ ...current, [name]: value }))
    setPaymentErrors((current) => ({ ...current, [name]: null }))
  }

  function handleReverseChange(event) {
    const { name, value } = event.target
    setReverseForm((current) => ({ ...current, [name]: value }))
    setPaymentErrors((current) => ({ ...current, [name]: null }))
  }

  function handleApprovePayment() {
    if (!payment) return
    setPendingPaymentAction({
      action: 'approve',
      payload: {},
      description: `Duyệt khoản thanh toán ${payment.endpointId || payment.id}?`,
    })
  }

  function handlePaySubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!payForm.proofAttachmentId) nextErrors.proofAttachmentId = 'proofAttachmentId là bắt buộc'
    setPaymentErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !payment) return

    setPendingPaymentAction({
      action: 'pay',
      payload: {
        proofAttachmentId: Number(getLongIdFromUuid(payForm.proofAttachmentId)),
        notes: payForm.notes.trim() || null,
      },
      description: 'Xác nhận đã giải ngân với chứng từ và ghi chú đã nhập?',
    })
  }

  function handleReverseSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!reverseForm.compensationReason.trim()) nextErrors.compensationReason = 'Vui lòng nhập lý do reverse'
    setPaymentErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !payment) return

    setPendingPaymentAction({
      action: 'reverse',
      payload: { compensationReason: reverseForm.compensationReason.trim() },
      description: 'Hoàn tác khoản thanh toán này? Hệ thống sẽ lưu một bút toán bù trừ.',
    })
  }

  async function executePaymentAction() {
    if (!pendingPaymentAction || !payment) return

    setIsPaymentMutating(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await financeApi.payments[pendingPaymentAction.action](payment.id, pendingPaymentAction.payload)
      const nextPayment = normalizePayment(response)
      setPayment(nextPayment)
      setPaymentId(nextPayment?.endpointId || nextPayment?.id || paymentId)
      setPayForm(payDefaults)
      setReverseForm(reverseDefaults)
      await onDashboardRefresh?.()
      await loadPayments()
      onSuccess(`Đã thực hiện ${paymentActionLabels[pendingPaymentAction.action]}`)
      setPendingPaymentAction(null)
    } catch (err) {
      setPaymentErrors(getFieldErrors(err))
      onError(getErrorMessage(err))
    } finally {
      setIsPaymentMutating(false)
    }
  }

  function handleInternalChange(event) {
    const { name, value } = event.target
    if (name === 'majorTaskId') {
      setSubtaskBudgetForm(subtaskBudgetDefaults)
      setSubtaskBudgetErrors({})
    }
    setInternalForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'majorTaskId') {
        next.sourceSubtaskId = ''
        next.targetSubtaskId = ''
      }
      return next
    })
    setInternalErrors((current) => ({ ...current, [name]: null }))
  }

  function handleSubtaskBudgetChange(event) {
    const { name, value } = event.target
    setSubtaskBudgetForm((current) => ({ ...current, [name]: value }))
    setSubtaskBudgetErrors((current) => ({ ...current, [name]: null }))
  }

  async function handleSubtaskBudgetSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!internalForm.majorTaskId) nextErrors.majorTaskId = 'Vui lòng chọn task cha trước'
    if (!subtaskBudgetForm.subtaskId) nextErrors.subtaskId = 'Vui lòng chọn task con'
    const amountError = validatePositiveAmount(subtaskBudgetForm.amount, 'Ngân sách phải lớn hơn 0')
    if (amountError) nextErrors.amount = amountError
    setSubtaskBudgetErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsAllocatingSubtask(true)
    onError(null)
    onSuccess(null)
    try {
      const response = await financeApi.reallocation.allocateSubtask({
        majorTaskId: internalForm.majorTaskId,
        subtaskId: subtaskBudgetForm.subtaskId,
        amount: subtaskBudgetForm.amount.trim(),
      })
      const nextSubtask = normalizeSubtask(response)
      setInternalSubtasks((current) => current.map((task) => String(task.id) === String(nextSubtask.id) ? nextSubtask : task))
      setSubtaskBudgetForm(subtaskBudgetDefaults)
      setSubtaskBudgetErrors({})
      onSuccess(`Đã cấp ngân sách cho task con ${nextSubtask.title}`)
    } catch (err) {
      setSubtaskBudgetErrors(getFieldErrors(err))
      onError(getErrorMessage(err))
    } finally {
      setIsAllocatingSubtask(false)
    }
  }

  function handleInternalSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!internalForm.majorTaskId) nextErrors.majorTaskId = 'Vui lòng chọn task cha'
    if (!internalForm.sourceSubtaskId) nextErrors.sourceSubtaskId = 'Vui lòng chọn task con nguồn'
    if (!internalForm.targetSubtaskId) nextErrors.targetSubtaskId = 'Vui lòng chọn task con đích'
    if (internalForm.sourceSubtaskId && internalForm.sourceSubtaskId === internalForm.targetSubtaskId) {
      nextErrors.targetSubtaskId = 'Task con đích phải khác task con nguồn'
    }
    const amountError = validatePositiveAmount(internalForm.amount, 'Số tiền phải lớn hơn 0')
    if (amountError) nextErrors.amount = amountError
    const sourceTask = internalSubtasks.find((task) => String(task.id) === String(internalForm.sourceSubtaskId))
    if (!amountError && sourceTask && Number(internalForm.amount) > Number(sourceTask.availableBudget || 0)) {
      nextErrors.amount = `Task con nguồn chỉ còn ${formatCurrency(sourceTask.availableBudget)} khả dụng`
    }
    if (!internalForm.reason.trim()) nextErrors.reason = 'Vui lòng nhập lý do'
    setInternalErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPendingReallocation({
      type: 'internal',
      title: 'Xác nhận điều chuyển nội bộ',
      description: 'Điều chuyển ngân sách ngay giữa hai task con thuộc cùng task cha?',
      payload: {
        majorTaskId: internalForm.majorTaskId,
        sourceSubtaskId: internalForm.sourceSubtaskId,
        targetSubtaskId: internalForm.targetSubtaskId,
        amount: internalForm.amount.trim(),
        reason: internalForm.reason.trim(),
      },
    })
  }

  function handleEscalateChange(event) {
    const { name, value } = event.target
    setEscalateForm((current) => ({ ...current, [name]: value }))
    setEscalateErrors((current) => ({ ...current, [name]: null }))
  }

  function handleEscalateSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!escalateForm.sourceMajorTaskId) nextErrors.sourceMajorTaskId = 'Vui lòng chọn task cha nguồn'
    if (!escalateForm.targetMajorTaskId) nextErrors.targetMajorTaskId = 'Vui lòng chọn task cha đích'
    if (escalateForm.sourceMajorTaskId && escalateForm.sourceMajorTaskId === escalateForm.targetMajorTaskId) {
      nextErrors.targetMajorTaskId = 'Target phải khác source'
    }
    const amountError = validatePositiveAmount(escalateForm.amount, 'Amount phải lớn hơn 0')
    if (amountError) nextErrors.amount = amountError
    if (!escalateForm.reason.trim()) nextErrors.reason = 'Vui lòng nhập lý do'
    setEscalateErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPendingReallocation({
      type: 'escalate',
      title: 'Xác nhận yêu cầu điều chuyển liên hạng mục',
      description: 'Tạo yêu cầu điều chuyển ngân sách giữa hai task cha?',
      payload: {
        sourceMajorTaskId: escalateForm.sourceMajorTaskId,
        targetMajorTaskId: escalateForm.targetMajorTaskId,
        amount: escalateForm.amount.trim(),
        reason: escalateForm.reason.trim(),
      },
    })
  }

  async function executeReallocation() {
    if (!pendingReallocation) return

    setIsReallocating(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await financeApi.reallocation[pendingReallocation.type](pendingReallocation.payload)
      setLastReallocation(response)
      if (pendingReallocation.type === 'internal') {
        setInternalForm(internalDefaults)
        setInternalSubtasks([])
        setInternalErrors({})
      } else {
        setEscalateForm(escalateDefaults)
        setEscalateErrors({})
      }
      const successMessage = pendingReallocation.type === 'internal'
        ? 'Đã điều chuyển ngân sách giữa các task con'
        : 'Đã gửi yêu cầu điều chuyển ngân sách giữa các task cha'
      setPendingReallocation(null)
      await onDashboardRefresh?.()
      onSuccess(successMessage)
    } catch (err) {
      if (pendingReallocation.type === 'internal') {
        setInternalErrors(getFieldErrors(err))
      } else {
        setEscalateErrors(getFieldErrors(err))
      }
      onError(getErrorMessage(err))
    } finally {
      setIsReallocating(false)
    }
  }

  async function handleExport(format) {
    setExportingFormat(format)
    onError(null)
    onSuccess(null)

    try {
      const exportedFile = await financeApi.exports.downloadEventExport(eventId, format)
      onSuccess(`Đã tải file ${exportedFile.filename}`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setExportingFormat('')
    }
  }

  return (
    <section className="space-y-4">
      <Card title="Thanh toán, điều chuyển và xuất báo cáo">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-bg text-primary">
                <Banknote size={20} />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Thanh toán và giải ngân</p>
                <p className="mt-1 text-sm text-neutral-500">Tra cứu khoản thanh toán được tạo sau khi yêu cầu chi phí được duyệt.</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-bg text-primary">
                <Repeat2 size={20} />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Điều chuyển ngân sách</p>
                <p className="mt-1 text-sm text-neutral-500">Gửi duyệt khi cần chuyển ngân sách giữa các task cha đã được phân bổ.</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-bg text-primary">
                <FileDown size={20} />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Xuất báo cáo tài chính</p>
                <p className="mt-1 text-sm text-neutral-500">Tải báo cáo Excel hoặc PDF của sự kiện.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <PaymentActionsCard
          payments={payments}
          paymentId={paymentId}
          payment={payment}
          isLoading={isPaymentLoading}
          isPaymentsLoading={isPaymentsLoading}
          isMutating={isPaymentMutating}
          payForm={payForm}
          reverseForm={reverseForm}
          errors={paymentErrors}
          onPaymentIdChange={(event) => {
            setPaymentId(event.target.value)
            setPaymentErrors((current) => ({ ...current, paymentId: null }))
          }}
          onLoadPayment={handleLoadPayment}
          onSelectPayment={selectPayment}
          onApprove={handleApprovePayment}
          onPayChange={handlePayChange}
          onPaySubmit={handlePaySubmit}
          onReverseChange={handleReverseChange}
          onReverseSubmit={handleReverseSubmit}
        />

        <div className="space-y-4">
          <ExportCard exportingFormat={exportingFormat} onExport={handleExport} />
          <InternalReallocationForm
            form={internalForm}
            errors={internalErrors}
            budgetForm={subtaskBudgetForm}
            budgetErrors={subtaskBudgetErrors}
            majorTasks={majorTasks}
            subtasks={internalSubtasks}
            isLoadingSubtasks={isInternalSubtasksLoading}
            isAllocatingSubtask={isAllocatingSubtask}
            onChange={handleInternalChange}
            onSubmit={handleInternalSubmit}
            onBudgetChange={handleSubtaskBudgetChange}
            onBudgetSubmit={handleSubtaskBudgetSubmit}
          />
          <EscalatedReallocationForm
            form={escalateForm}
            errors={escalateErrors}
            majorTasks={majorTasks}
            onChange={handleEscalateChange}
            onSubmit={handleEscalateSubmit}
          />
          <LastReallocationResult result={lastReallocation} />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingPaymentAction)}
        title={paymentActionLabels[pendingPaymentAction?.action] || 'Xác nhận thanh toán'}
        description={pendingPaymentAction?.description || ''}
        loading={isPaymentMutating}
        onClose={() => setPendingPaymentAction(null)}
        onConfirm={executePaymentAction}
      />

      <ConfirmDialog
        open={Boolean(pendingReallocation)}
        title={pendingReallocation?.title || 'Xác nhận điều chuyển'}
        description={pendingReallocation?.description || ''}
        loading={isReallocating}
        onClose={() => setPendingReallocation(null)}
        onConfirm={executeReallocation}
      />
    </section>
  )
}

function PaymentActionsCard({
  payments,
  paymentId,
  payment,
  isLoading,
  isPaymentsLoading,
  isMutating,
  payForm,
  reverseForm,
  errors,
  onPaymentIdChange,
  onLoadPayment,
  onSelectPayment,
  onApprove,
  onPayChange,
  onPaySubmit,
  onReverseChange,
  onReverseSubmit,
}) {
  return (
    <Card title="Chi tiết thanh toán và thao tác">
      <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-neutral-900">Thanh toán của sự kiện</p>
          {isPaymentsLoading ? <Spinner size="sm" /> : <Badge variant="default">{payments.length} khoản</Badge>}
        </div>
        {payments.length === 0 && !isPaymentsLoading ? (
          <p className="text-sm text-neutral-500">Chưa có thanh toán. Payment sẽ xuất hiện sau khi expense được duyệt.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-left hover:border-primary/40"
                onClick={() => onSelectPayment(item)}
              >
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">#{item.endpointId || item.id}</span>
                  <span className="block text-xs text-neutral-500">{formatCurrency(item.amount)}</span>
                </span>
                <Badge variant={paymentStatusVariants[item.status] || 'default'}>{paymentStatusLabels[item.status] || item.status}</Badge>
              </button>
            ))}
          </div>
        )}
      </div>
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]" onSubmit={onLoadPayment} noValidate>
        <FormField label="Mã thanh toán" required error={errors.paymentId}>
          <Input value={paymentId} onChange={onPaymentIdChange} error={errors.paymentId} placeholder="ID hoặc UUID thanh toán" />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" loading={isLoading} leftIcon={<Search size={16} />}>
            Tải thanh toán
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="mt-4 flex min-h-[220px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !payment ? (
        <div className="mt-4">
          <EmptyState icon={<Banknote size={24} />} title="Chưa chọn thanh toán" description="Nhập mã thanh toán để xem chi tiết và thực hiện phê duyệt, giải ngân hoặc hoàn tác." />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={paymentStatusVariants[payment.status] || 'default'}>{paymentStatusLabels[payment.status] || payment.status}</Badge>
              <Badge variant="default">ID {payment.endpointId || payment.id}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PaymentMetric label="Số tiền" value={formatCurrency(payment.amount)} />
              <PaymentMetric label="Yêu cầu chi phí" value={getLongIdFromUuid(payment.expenseRequestId) || 'Chưa có'} />
              <PaymentMetric label="Thanh toán gốc" value={getLongIdFromUuid(payment.parentPaymentId) || 'Không có'} />
              <PaymentMetric label="Trạng thái" value={payment.status} />
            </div>
          </div>

          {payment.status === 'PENDING' && payment.allowedActions.includes('approve') ? (
            <Button type="button" variant="secondary" loading={isMutating} leftIcon={<CheckCircle2 size={16} />} onClick={onApprove}>
              Duyệt thanh toán
            </Button>
          ) : null}

          {payment.status === 'APPROVED' && payment.allowedActions.includes('pay') ? (
            <form className="rounded-lg border border-neutral-200 bg-neutral-50 p-4" onSubmit={onPaySubmit} noValidate>
              <div className="mb-3 flex items-start gap-3 text-sm text-neutral-600">
                <Send size={18} className="mt-0.5 shrink-0 text-primary" />
                <p>Ghi nhận chứng từ thanh toán trước khi xác nhận đã giải ngân.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Mã chứng từ thanh toán" required error={errors.proofAttachmentId}>
                  <Input name="proofAttachmentId" value={payForm.proofAttachmentId} onChange={onPayChange} error={errors.proofAttachmentId} placeholder="Attachment ID" />
                </FormField>
                <FormField label="Notes" error={errors.notes}>
                  <Textarea name="notes" value={payForm.notes} onChange={onPayChange} error={errors.notes} placeholder="Ghi chú thanh toán" />
                </FormField>
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="submit" loading={isMutating} leftIcon={<Send size={16} />}>
                  Xác nhận giải ngân
                </Button>
              </div>
            </form>
          ) : null}

          {payment.status === 'PAID' && payment.allowedActions.includes('reverse') ? (
            <form className="rounded-lg border border-danger/20 bg-danger-bg p-4" onSubmit={onReverseSubmit} noValidate>
              <FormField label="Lý do hoàn tác" required error={errors.compensationReason}>
                <Textarea
                  name="compensationReason"
                  value={reverseForm.compensationReason}
                  onChange={onReverseChange}
                  error={errors.compensationReason}
                  placeholder="Lý do hoàn tác thanh toán"
                />
              </FormField>
              <div className="mt-4 flex justify-end">
                <Button type="submit" variant="danger" loading={isMutating} leftIcon={<ShieldAlert size={16} />}>
                  Hoàn tác thanh toán
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      )}
    </Card>
  )
}

function PaymentMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function ExportCard({ exportingFormat, onExport }) {
  return (
    <Card title="Xuất báo cáo">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" loading={exportingFormat === 'excel'} leftIcon={<Download size={16} />} onClick={() => onExport('excel')}>
          Excel
        </Button>
        <Button type="button" variant="secondary" loading={exportingFormat === 'pdf'} leftIcon={<FileDown size={16} />} onClick={() => onExport('pdf')}>
          PDF
        </Button>
      </div>
    </Card>
  )
}

function InternalReallocationForm({ form, errors, budgetForm, budgetErrors, majorTasks, subtasks, isLoadingSubtasks, isAllocatingSubtask, onChange, onSubmit, onBudgetChange, onBudgetSubmit }) {
  const sourceTask = subtasks.find((task) => String(task.id) === String(form.sourceSubtaskId))
  const targetTask = subtasks.find((task) => String(task.id) === String(form.targetSubtaskId))
  const unallocatedSubtasks = subtasks.filter((task) => Number(task.allocatedBudget || 0) <= 0)

  return (
    <Card title="Điều chuyển giữa các task con">
      <div className="space-y-4">
        <p className="rounded-lg border border-info/20 bg-info-bg p-3 text-sm text-info">
          Task con cần được cấp ngân sách ban đầu từ task cha trước. Sau đó, điều chuyển chỉ dùng để cân đối lại giữa các task con cùng hạng mục.
        </p>
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
        <form className="rounded-lg border border-neutral-200 bg-neutral-50 p-4" onSubmit={onBudgetSubmit} noValidate>
          <h4 className="font-semibold text-neutral-900">Cấp ngân sách ban đầu cho task con</h4>
          <p className="mt-1 text-xs text-neutral-500">Tổng cấp cho các task con không được vượt ngân sách task cha.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
            <FormField label="Task con chưa có ngân sách" error={budgetErrors.subtaskId}>
              <Select name="subtaskId" value={budgetForm.subtaskId} onChange={onBudgetChange} error={budgetErrors.subtaskId} disabled={!form.majorTaskId || isLoadingSubtasks}>
                <option value="">{isLoadingSubtasks ? 'Đang tải...' : 'Chọn task con'}</option>
                {unallocatedSubtasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </Select>
            </FormField>
            <FormField label="Ngân sách" error={budgetErrors.amount}>
              <Input type="text" inputMode="numeric" name="amount" value={budgetForm.amount} onChange={onBudgetChange} error={budgetErrors.amount} placeholder="1000000" />
            </FormField>
            <Button type="submit" loading={isAllocatingSubtask} disabled={!form.majorTaskId || unallocatedSubtasks.length === 0}>
              Cấp tiền
            </Button>
          </div>
          {form.majorTaskId && !isLoadingSubtasks && unallocatedSubtasks.length === 0 ? (
            <p className="mt-3 text-xs text-neutral-500">Tất cả task con trong hạng mục này đã có ngân sách ban đầu.</p>
          ) : null}
        </form>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <h4 className="font-semibold text-neutral-900">Điều chuyển ngân sách đã cấp</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Task con nguồn" required error={errors.sourceSubtaskId}>
            <Select
              name="sourceSubtaskId"
              value={form.sourceSubtaskId}
              onChange={onChange}
              error={errors.sourceSubtaskId}
              disabled={!form.majorTaskId || isLoadingSubtasks}
            >
              <option value="">{isLoadingSubtasks ? 'Đang tải...' : 'Chọn nguồn'}</option>
              {subtasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} - còn {formatCurrency(task.availableBudget)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Task con đích" required error={errors.targetSubtaskId}>
            <Select
              name="targetSubtaskId"
              value={form.targetSubtaskId}
              onChange={onChange}
              error={errors.targetSubtaskId}
              disabled={!form.majorTaskId || isLoadingSubtasks}
            >
              <option value="">{isLoadingSubtasks ? 'Đang tải...' : 'Chọn đích'}</option>
              {subtasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} - đang cấp {formatCurrency(task.allocatedBudget)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        {sourceTask || targetTask ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sourceTask ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs font-medium text-neutral-500">Nguồn khả dụng hiện tại</p>
                <p className="mt-1 font-bold text-neutral-900">{formatCurrency(sourceTask.availableBudget)}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Phân bổ {formatCurrency(sourceTask.allocatedBudget)} / đã giữ {formatCurrency(sourceTask.committedAmount)}
                </p>
              </div>
            ) : null}
            {targetTask ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs font-medium text-neutral-500">Ngân sách task đích hiện tại</p>
                <p className="mt-1 font-bold text-neutral-900">{formatCurrency(targetTask.allocatedBudget)}</p>
                <p className="mt-1 text-xs text-neutral-500">Sau điều chuyển, ngân sách được cộng ngay khi xác nhận.</p>
              </div>
            ) : null}
          </div>
        ) : null}
        <FormField label="Số tiền" required error={errors.amount}>
          <Input type="text" inputMode="numeric" name="amount" value={form.amount} onChange={onChange} error={errors.amount} placeholder="2000000" />
        </FormField>
        <FormField label="Lý do" required error={errors.reason}>
          <Textarea name="reason" value={form.reason} onChange={onChange} error={errors.reason} placeholder="Lý do điều chuyển nội bộ" />
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" leftIcon={<RefreshCw size={16} />} disabled={subtasks.length < 2}>
            Thực hiện điều chuyển
          </Button>
        </div>
        </form>
      </div>
    </Card>
  )
}

function EscalatedReallocationForm({ form, errors, majorTasks, onChange, onSubmit }) {
  return (
    <Card title="Yêu cầu điều chuyển giữa các task cha">
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Task cha nguồn" required error={errors.sourceMajorTaskId}>
            <Select name="sourceMajorTaskId" value={form.sourceMajorTaskId} onChange={onChange} error={errors.sourceMajorTaskId}>
              <option value="">Chọn source</option>
              {majorTasks.map((task) => (
                <option key={task.taskId} value={task.taskId}>
                  {task.taskName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Task cha đích" required error={errors.targetMajorTaskId}>
            <Select name="targetMajorTaskId" value={form.targetMajorTaskId} onChange={onChange} error={errors.targetMajorTaskId}>
              <option value="">Chọn target</option>
              {majorTasks.map((task) => (
                <option key={task.taskId} value={task.taskId}>
                  {task.taskName}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Số tiền" required error={errors.amount}>
          <Input type="text" inputMode="numeric" name="amount" value={form.amount} onChange={onChange} error={errors.amount} placeholder="2000000" />
        </FormField>
        <FormField label="Lý do" required error={errors.reason}>
          <Textarea name="reason" value={form.reason} onChange={onChange} error={errors.reason} placeholder="Lý do cần escalate điều chuyển" />
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" leftIcon={<RefreshCw size={16} />} disabled={majorTasks.length < 2}>
            Gửi duyệt điều chuyển
          </Button>
        </div>
      </form>
    </Card>
  )
}

function LastReallocationResult({ result }) {
  if (!result) return null

  return (
    <Card title="Kết quả điều chuyển gần nhất">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PaymentMetric label="Trạng thái" value={result.status || 'N/A'} />
        <PaymentMetric label="Loại" value={result.type || 'N/A'} />
        <PaymentMetric label="Số tiền" value={formatCurrency(result.amount)} />
        <PaymentMetric label="Yêu cầu chi phí" value={getLongIdFromUuid(result.expenseRequestId) || 'Không có'} />
      </div>
      <p className="mt-3 text-sm text-neutral-500">{result.reason || 'Không có lý do trả về.'}</p>
    </Card>
  )
}

export default FinanceOperationsPanel
