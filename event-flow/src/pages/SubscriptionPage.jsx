import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Zap,
  Users,
  Calendar,
  Database,
  Cpu,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  X,
} from 'lucide-react'

import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import AlertBanner from '../components/feedback/AlertBanner'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import FormField from '../components/form/FormField'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import SubscriptionCheckoutForm from '../features/subscriptions/SubscriptionCheckoutForm'
import { organizationTypes } from '../features/organizations/organizationConstants'
import {
  getOrganizationPermissions,
  getOrganizationSubscriptionPolicy,
} from '../features/organizations/organizationPermissions'
import { subscriptionApi } from '../api/subscriptionApi'
import { organizationApi, organizationMemberApi } from '../api'
import { getTokenUserId } from '../services/tokenService'
import { unwrapData } from '../api/response'
import { getErrorMessage, getFieldErrors } from '../utils/apiError'
import { getApiMessage } from '../api/response'
import { cn, isSubscriptionGateError } from '../utils'
import { formatCurrency, formatDateTime } from '../utils/dateFormat'

function SubscriptionPage() {
  const { organizationId } = useParams()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [isResolvingOrganization, setIsResolvingOrganization] = useState(false)
  const [error, setError] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)
  const [plans, setPlans] = useState([])
  const [activeSub, setActiveSub] = useState(null)
  const [billingHistory, setBillingHistory] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [workspaceForm, setWorkspaceForm] = useState({
    organizationName: '',
    type: 'EVENT',
    phone: '',
    email: '',
    description: '',
  })
  const [workspaceErrors, setWorkspaceErrors] = useState({})
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)

  // Mutation states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutPlanId, setCheckoutPlanId] = useState(null)
  const [upgradePlanId, setUpgradePlanId] = useState(null)
  const [pendingUpgradePayload, setPendingUpgradePayload] = useState(null)
  const [pendingAction, setPendingAction] = useState(null) // 'cancel' | 'resume'
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState(null)
  const [mutationResult, setMutationResult] = useState(null)

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === activeSub?.planId) || null,
    [activeSub?.planId, plans]
  )
  const isAutoRenewDisabled = activeSub?.autoRenew === false || Boolean(activeSub?.cancelledAt)
  const isRenewableSubscription = activeSub?.status === 'ACTIVE' && ['MONTHLY', 'YEARLY'].includes(activeSub?.billingCycle)
  const hasSubscriptionGateError = isSubscriptionGateError(errorDetail)

  const resolveWorkspaceBillingAccess = useCallback(async (workspaceId) => {
    const currentUserId = getTokenUserId()
    if (!currentUserId) {
      return false
    }

    const response = await organizationMemberApi.getByOrganization(workspaceId, { page: 0, size: 1000 })
    const members = Array.isArray(response.data) ? response.data : response.data?.content || []
    const currentMembership = members.find((member) => Number(member.userId) === Number(currentUserId))
    const nextPermissions = getOrganizationPermissions(currentMembership?.role)
    return getOrganizationSubscriptionPolicy(nextPermissions).canManageSubscription
  }, [])

  const fetchData = useCallback(async () => {
    if (!organizationId) return

    setIsLoading(true)
    setError(null)
    setErrorDetail(null)
    try {
      const canManageBilling = await resolveWorkspaceBillingAccess(organizationId)
      if (!canManageBilling) {
        navigate(`/organizations/${organizationId}`, { replace: true })
        return
      }

      const [plansResult, subResult, historyResult] = await Promise.allSettled([
        subscriptionApi.getPlans(),
        subscriptionApi.getActiveSubscription(organizationId),
        subscriptionApi.getBillingHistory(organizationId)
      ])

      if (plansResult.status === 'fulfilled') {
        setPlans(Array.isArray(plansResult.value) ? plansResult.value : [])
      } else {
        throw plansResult.reason
      }

      if (subResult.status === 'fulfilled') {
        setActiveSub(subResult.value || null)
      } else if (subResult.reason?.response?.status === 404) {
        setActiveSub(null)
      } else {
        throw subResult.reason
      }

      if (historyResult.status === 'fulfilled') {
        setBillingHistory(Array.isArray(historyResult.value) ? historyResult.value : [])
      } else if (historyResult.reason?.response?.status === 404) {
        setBillingHistory([])
      } else {
        throw historyResult.reason
      }
    } catch (err) {
      setErrorDetail(err)
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [navigate, organizationId, resolveWorkspaceBillingAccess])

  useEffect(() => {
    if (organizationId) return

    let isMounted = true

    async function loadWorkspaces() {
      setIsResolvingOrganization(true)
      setIsLoading(true)
      setError(null)
      setErrorDetail(null)

      try {
        const response = await organizationApi.getAll()
        const organizations = unwrapData(response.data) || []

        if (!isMounted) return

        setWorkspaces(Array.isArray(organizations) ? organizations : [])
        setIsLoading(false)
      } catch (err) {
        if (!isMounted) return
        setErrorDetail(err)
        setError(getErrorMessage(err))
        setIsLoading(false)
      } finally {
        if (isMounted) {
          setIsResolvingOrganization(false)
        }
      }
    }

    loadWorkspaces()

    return () => {
      isMounted = false
    }
  }, [organizationId, navigate])

  useEffect(() => {
    fetchData()
  }, [fetchData, organizationId, navigate])

  async function handleCheckout(e, formData) {
    e.preventDefault()
    setIsSubmitting(true)
    setFormErrors({})
    setSuccessMessage(null)
    setMutationResult(null)
    setError(null)
    setErrorDetail(null)

    try {
      const response = await subscriptionApi.checkout(organizationId, formData)
      handleMutationResponse(response, 'Đã tạo yêu cầu đăng ký. Vui lòng kiểm tra thông tin thanh toán.')
      await fetchData()
      setCheckoutPlanId(null)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      setFormErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) {
        setErrorDetail(err)
        setError(getErrorMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpgrade(e, formData) {
    e.preventDefault()
    setFormErrors({})
    setError(null)
    setErrorDetail(null)
    setSuccessMessage(null)
    setMutationResult(null)
    if (Number(formData.planId) === Number(activeSub?.planId)) {
      setFormErrors({ planId: 'Vui lòng chọn gói khác gói hiện tại' })
      return
    }
    const targetPlan = plans.find((plan) => Number(plan.id) === Number(formData.planId))
    const currentPrice = Number(activePlan?.price ?? activeSub?.price ?? 0)
    const targetPrice = Number(targetPlan?.price ?? 0)
    if (targetPlan && targetPrice <= currentPrice) {
      setFormErrors({
        planId: 'Backend hiện chỉ hỗ trợ nâng cấp lên gói có giá cao hơn. Để hạ gói, hãy hủy gia hạn hoặc liên hệ quản trị viên.',
      })
      return
    }
    setPendingUpgradePayload({
      targetPlanId: formData.planId,
      paymentMethod: formData.paymentMethod,
    })
  }

  async function handleConfirmUpgrade() {
    if (!pendingUpgradePayload) return

    setIsSubmitting(true)
    setError(null)
    setErrorDetail(null)

    try {
      const response = await subscriptionApi.upgrade(organizationId, pendingUpgradePayload)
      handleMutationResponse(response, 'Đã gửi yêu cầu nâng cấp gói thành công.')
      await fetchData()
      setUpgradePlanId(null)
      setPendingUpgradePayload(null)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      setFormErrors({
        ...fieldErrors,
        planId: fieldErrors.planId || fieldErrors.targetPlanId,
      })
      if (Object.keys(fieldErrors).length === 0) {
        setErrorDetail(err)
        setError(getErrorMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancelSubscription() {
    setIsSubmitting(true)
    setError(null)
    setErrorDetail(null)
    setSuccessMessage(null)
    setMutationResult(null)
    try {
      const response = await subscriptionApi.cancel(organizationId)
      handleMutationResponse(response, 'Đã hủy gia hạn workspace thành công')
      await fetchData()
    } catch (err) {
      setErrorDetail(err)
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
      setPendingAction(null)
    }
  }

  async function handleResumeSubscription() {
    setIsSubmitting(true)
    setError(null)
    setErrorDetail(null)
    setSuccessMessage(null)
    setMutationResult(null)
    try {
      const response = await subscriptionApi.resume(organizationId)
      handleMutationResponse(response, 'Đã khôi phục gia hạn workspace thành công')
      await fetchData()
    } catch (err) {
      setErrorDetail(err)
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
      setPendingAction(null)
    }
  }

  function handleMutationResponse(response, fallback) {
    const url = response?.paymentUrl || response?.redirectUrl
    const message = response?.instructions || response?.paymentInstructions || getApiMessage(response, fallback)

    setSuccessMessage(message)
    setMutationResult(url ? { message, url } : null)
  }

  function handleWorkspaceChange(event) {
    const { name, value } = event.target
    setWorkspaceForm((current) => ({ ...current, [name]: value }))
    setWorkspaceErrors((current) => ({ ...current, [name]: null }))
    setError(null)
  }

  function validateWorkspaceForm() {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!workspaceForm.organizationName.trim()) nextErrors.organizationName = 'Vui lòng nhập tên workspace'
    if (!workspaceForm.description.trim()) nextErrors.description = 'Vui lòng nhập mô tả ngắn'
    if (!workspaceForm.type) nextErrors.type = 'Vui lòng chọn loại workspace'
    if (!workspaceForm.phone.trim()) nextErrors.phone = 'Vui lòng nhập số điện thoại'
    if (!workspaceForm.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email'
    } else if (!emailPattern.test(workspaceForm.email.trim())) {
      nextErrors.email = 'Email không hợp lệ'
    }

    setWorkspaceErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleCreateWorkspace(event) {
    event.preventDefault()
    if (!validateWorkspaceForm()) return

    const createdByUserId = getTokenUserId()
    if (!createdByUserId) {
      setError('Phiên đăng nhập chưa có mã người dùng. Vui lòng đăng xuất rồi đăng nhập lại để tạo workspace.')
      return
    }

    setIsCreatingWorkspace(true)
    setError(null)
    setErrorDetail(null)

    try {
      const response = await organizationApi.create({
        organizationName: workspaceForm.organizationName.trim(),
        description: workspaceForm.description.trim(),
        type: workspaceForm.type,
        logoUrl: null,
        phone: workspaceForm.phone.trim(),
        email: workspaceForm.email.trim(),
        createdByUserId,
      })
      const created = unwrapData(response.data)
      if (created?.id) {
        navigate(`/organizations/${created.id}/subscription`, { replace: true })
      } else {
        navigate('/organizations', { replace: true })
      }
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      setWorkspaceErrors((current) => ({ ...current, ...fieldErrors }))
      setErrorDetail(err)
      setError(getErrorMessage(err))
    } finally {
      setIsCreatingWorkspace(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">
            {isResolvingOrganization ? 'Đang tải workspace billing...' : 'Đang tải thông tin billing...'}
          </p>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <WorkspaceBillingStart
        error={error}
        workspaces={workspaces}
        form={workspaceForm}
        errors={workspaceErrors}
        isCreating={isCreatingWorkspace}
        onChange={handleWorkspaceChange}
        onCreate={handleCreateWorkspace}
        onOpen={(workspace) => navigate(`/organizations/${workspace.id}/subscription`)}
      />
    )
  }

  return (
    <main className="min-h-[calc(100vh-129px)] bg-neutral-50 p-6 text-neutral-700">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Workspace billing</h1>
              <p className="mt-1 text-sm text-neutral-500">Quản lý gói dịch vụ, hạn mức và chi phí cho workspace này</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(`/organizations/${organizationId}`)}
          >
            Về workspace
          </Button>
        </section>

        {hasSubscriptionGateError && <SubscriptionGateBanner error={errorDetail} organizationId={organizationId} />}
        {!hasSubscriptionGateError && error && <AlertBanner variant="error" message={error} />}
        {successMessage && !mutationResult && <AlertBanner variant="success" message={successMessage} />}
        {mutationResult && <PaymentResult result={mutationResult} />}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Card title="Gói workspace hiện tại">
              {activeSub ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={isAutoRenewDisabled ? 'warning' : 'success'}>
                      {activeSub.planName || 'Gói hiện tại'}
                    </Badge>
                    <span className="text-xs text-neutral-500">Hết hạn: {formatDateTime(activeSub.endDate)}</span>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900">Trạng thái: {getSubscriptionStatusLabel(activeSub)}</p>
                    <p className="mt-1 text-xs text-neutral-500">Chu kỳ: {getBillingCycleLabel(activeSub.billingCycle)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => setUpgradePlanId(activeSub.planId)}
                    >
                      <ArrowRight size={16} /> Thay đổi gói
                    </Button>
                    {isRenewableSubscription && !isAutoRenewDisabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-danger hover:text-danger"
                        onClick={() => setPendingAction('cancel')}
                      >
                        Hủy gia hạn
                      </Button>
                    )}
                    {isRenewableSubscription && isAutoRenewDisabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-primary hover:text-primary"
                        onClick={() => setPendingAction('resume')}
                      >
                        Khôi phục gia hạn
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-neutral-500">Workspace này hiện chưa có gói dịch vụ.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => setCheckoutPlanId(plans[0]?.id)}
                  >
                    Chọn gói ngay
                  </Button>
                </div>
              )}
            </Card>

            <Card title="Hạn mức sử dụng" headerRight={
              <Button variant="secondary" size="sm" onClick={fetchData} disabled={isLoading}>
                Làm mới sử dụng
              </Button>
            }>
              <div className="space-y-4">
                <UsageItem
                  icon={<Calendar size={16} />}
                  label="Sự kiện"
                  current={activeSub?.usage?.events || 0}
                  limit={activeSub?.maxEvents ?? activePlan?.maxEvents ?? 0}
                />
                <UsageItem
                  icon={<Users size={16} />}
                  label="Thành viên"
                  current={activeSub?.usage?.members || 0}
                  limit={activeSub?.maxMembers ?? activePlan?.maxMembers ?? 0}
                />
                <UsageItem
                  icon={<Users size={16} />}
                  label="Người tham dự"
                  current={activeSub?.usage?.attendees || 0}
                  limit={activePlan?.maxAttendees ?? 0}
                />
                <UsageItem
                  icon={<Database size={16} />}
                  label="Lưu trữ"
                  current={activeSub?.usage?.storage || 0}
                  limit={activeSub?.storageLimit ?? activePlan?.storageLimit ?? 0}
                  unit="GB"
                  formatter={formatStorageLimit}
                />
                <UsageItem
                  icon={<Cpu size={16} />}
                  label="AI Credits"
                  current={activeSub?.usage?.aiCredits || 0}
                  limit={activePlan?.aiCredits ?? activePlan?.aiCreditsLabel ?? 0}
                />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">So sánh các gói</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isActive={activeSub?.planId === plan.id}
                      onSelect={() => {
                        if (activeSub) {
                          setUpgradePlanId(plan.id)
                        } else {
                          setCheckoutPlanId(plan.id)
                        }
                      }}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<AlertCircle size={32} />}
                    title="Không tìm thấy gói"
                    description="Vui lòng liên hệ quản trị viên để biết thêm chi tiết."
                  />
                )}
              </div>
            </section>

            <Card title="Lịch sử thanh toán">
              {billingHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Ngày</th>
                        <th className="px-4 py-3 font-medium">Gói / mã giao dịch</th>
                        <th className="px-4 py-3 font-medium">Số tiền</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {billingHistory.map((bill) => (
                        <tr key={bill.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 text-neutral-700">{formatDateTime(bill.createdAt)}</td>
                          <td className="px-4 py-3 text-neutral-700">
                            <p className="font-medium text-neutral-900">{bill.planName || 'Gói workspace'}</p>
                            <p className="mt-1 font-mono text-xs text-neutral-500">{bill.gatewayTransactionRef || bill.idempotencyKey || `#${bill.id}`}</p>
                          </td>
                          <td className="px-4 py-3 text-neutral-900 font-semibold">{formatCurrency(bill.amount)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={getPaymentStatusVariant(bill.status)}>
                              {getPaymentStatusLabel(bill.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={<CreditCard size={32} />}
                  title="Chưa có lịch sử thanh toán"
                  description="Các giao dịch của bạn sẽ xuất hiện tại đây sau khi hoàn tất."
                />
              )}
            </Card>
          </div>
        </div>
      </div>

      <CheckoutModal
        open={!!checkoutPlanId}
        onClose={() => {
          setCheckoutPlanId(null)
          setFormErrors({})
        }}
        planId={checkoutPlanId}
        plans={plans}
        onSubmit={handleCheckout}
        isLoading={isSubmitting}
        errors={formErrors}
      />

      <UpgradeModal
        open={!!upgradePlanId}
        onClose={() => {
          setUpgradePlanId(null)
          setPendingUpgradePayload(null)
          setFormErrors({})
        }}
        planId={upgradePlanId}
        plans={plans}
        onSubmit={handleUpgrade}
        isLoading={isSubmitting}
        errors={formErrors}
      />

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction === 'cancel' ? 'Hủy gia hạn workspace?' : 'Khôi phục gia hạn workspace?'}
        description={pendingAction === 'cancel'
          ? 'Bạn có chắc chắn muốn hủy gia hạn cho workspace này? Workspace vẫn giữ quyền truy cập premium đến ngày hết hạn hiện tại.'
          : 'Bạn có muốn bật lại gia hạn cho workspace này?'}
        loading={isSubmitting}
        onClose={() => setPendingAction(null)}
        onConfirm={pendingAction === 'cancel' ? handleCancelSubscription : handleResumeSubscription}
      />

      <ConfirmDialog
        open={!!pendingUpgradePayload}
        title="Xác nhận nâng cấp gói?"
        description="EventFlow sẽ gửi yêu cầu nâng cấp và tạo giao dịch thanh toán theo phương thức đã chọn."
        loading={isSubmitting}
        onClose={() => setPendingUpgradePayload(null)}
        onConfirm={handleConfirmUpgrade}
      />
    </main>
  )
}

function WorkspaceBillingStart({
  error,
  workspaces,
  form,
  errors,
  isCreating,
  onChange,
  onCreate,
  onOpen,
}) {
  return (
    <main className="min-h-[calc(100vh-129px)] bg-neutral-50 p-6 text-neutral-700">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="info">Workspace billing</Badge>
              <h1 className="mt-4 text-2xl font-bold text-neutral-900 md:text-3xl">Chọn không gian làm việc để quản lý gói</h1>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Gói dịch vụ được gắn với workspace. Workspace có thể là không gian cá nhân của một người tổ chức sự kiện, một nhóm nhỏ, agency hoặc doanh nghiệp lớn.
              </p>
            </div>
            <Link
              to="/pricing"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark"
            >
              Xem bảng giá
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <AlertBanner variant="error" message={error} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card
            title="Workspace hiện có"
            headerRight={<span className="text-sm font-medium text-neutral-500">{workspaces.length} workspace</span>}
          >
            {workspaces.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    type="button"
                    className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary-bg"
                    onClick={() => onOpen(workspace)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
                          <Building2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-neutral-900">{workspace.organizationName || workspace.name || 'Workspace'}</p>
                          <p className="mt-1 text-xs font-medium uppercase text-neutral-500">{workspace.type || 'EVENT'}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="mt-1 shrink-0 text-neutral-400" />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-5 text-neutral-600">
                      {workspace.description || 'Quản lý gói, billing và hạn mức cho workspace này.'}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Building2 size={28} />}
                title="Chưa có workspace"
                description="Tạo workspace cá nhân để chọn gói và bắt đầu quản lý sự kiện."
              />
            )}
          </Card>

          <Card title="Tạo workspace cá nhân">
            <form className="space-y-4" onSubmit={onCreate}>
              <FormField label="Tên workspace" required error={errors.organizationName}>
                <Input
                  name="organizationName"
                  value={form.organizationName}
                  onChange={onChange}
                  error={errors.organizationName}
                  leftIcon={<Building2 size={16} />}
                  placeholder="VD: Sự kiện của Minh"
                />
              </FormField>

              <FormField label="Loại workspace" required error={errors.type}>
                <Select name="type" value={form.type} onChange={onChange} error={errors.type}>
                  {organizationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <FormField label="Email liên hệ" required error={errors.email}>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    error={errors.email}
                    leftIcon={<Mail size={16} />}
                    placeholder="you@example.com"
                  />
                </FormField>

                <FormField label="Số điện thoại" required error={errors.phone}>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    error={errors.phone}
                    leftIcon={<Phone size={16} />}
                    placeholder="090..."
                  />
                </FormField>
              </div>

              <FormField label="Mô tả" required error={errors.description}>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  error={errors.description}
                  placeholder="Không gian cá nhân để tổ chức sự kiện, quản lý team và billing."
                />
              </FormField>

              <Button type="submit" className="w-full" loading={isCreating} leftIcon={<Plus size={16} />}>
                Tạo và chọn gói
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  )
}

function CheckoutModal({ open, onClose, planId, plans, onSubmit, isLoading, errors }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-300 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Đăng ký gói workspace</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Đóng form đăng ký">
            <X size={16} />
          </Button>
        </div>
        <SubscriptionCheckoutForm
          plans={plans}
          onSubmit={onSubmit}
          isLoading={isLoading}
          errors={errors}
          initialValues={{ planId }}
          mode="checkout"
        />
      </div>
    </div>
  )
}

function UpgradeModal({ open, onClose, planId, plans, onSubmit, isLoading, errors }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-300 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Nâng cấp gói dịch vụ</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Đóng form nâng cấp">
            <X size={16} />
          </Button>
        </div>
        <SubscriptionCheckoutForm
          plans={plans}
          onSubmit={onSubmit}
          isLoading={isLoading}
          errors={errors}
          initialValues={{ planId }}
          mode="upgrade"
        />
      </div>
    </div>
  )
}

function UsageItem({ icon, label, current, limit, unit = '', formatter = null }) {
  const numericLimit = Number(limit)
  const numericCurrent = Number(current)
  const hasNumericLimit = Number.isFinite(numericLimit) && numericLimit > 0
  const percentage = hasNumericLimit && Number.isFinite(numericCurrent) ? Math.min((numericCurrent / numericLimit) * 100, 100) : 0
  const isWarning = percentage > 80
  const currentLabel = formatter ? formatter(current) : current
  const limitLabel = formatter ? formatter(limit) : limit

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-neutral-600">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-medium text-neutral-900">
          {currentLabel} / {limitLabel}{formatter ? '' : unit}
        </span>
      </div>
      <progress
        className={cn('h-1.5 w-full overflow-hidden rounded-full bg-neutral-100', isWarning ? 'accent-warning' : 'accent-primary')}
        value={percentage}
        max="100"
        aria-label={`${label}: ${currentLabel} trên ${limitLabel}`}
      />
    </div>
  )
}

function PlanCard({ plan, isActive, onSelect }) {
  const features = getPlanFeatures(plan)

  return (
    <div className={cn(
      'relative flex flex-col rounded-xl border p-5 transition-all hover:shadow-md',
      isActive ? 'border-primary bg-primary-bg/30 ring-1 ring-primary' : 'border-neutral-200 bg-white'
    )}>
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white">Hiện tại</Badge>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
        <Zap size={18} className={isActive ? 'text-primary' : 'text-neutral-300'} />
      </div>
      <div className="mb-6">
        <span className="text-2xl font-bold text-neutral-900">{formatCurrency(plan.price)}</span>
        <span className="text-sm text-neutral-500"> / {getBillingCycleLabel(plan.billingCycle)}</span>
      </div>
      <ul className="mb-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={`${plan.id}-${feature}`} className="flex items-start gap-2 text-xs text-neutral-600">
            <CheckCircle2 size={14} className="mt-0.5 text-success" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={isActive ? 'ghost' : 'primary'}
        size="sm"
        className="w-full"
        disabled={isActive}
        onClick={onSelect}
      >
        {isActive ? 'Đang sử dụng' : 'Chọn gói này'}
      </Button>
    </div>
  )
}

function PaymentResult({ result }) {
  return (
    <Card className="border-success/20 bg-success-bg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-success">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-success">Yêu cầu thanh toán đã được tạo</p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">{result.message}</p>
          </div>
        </div>
        <a
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-light"
          href={result.url}
          target="_blank"
          rel="noreferrer"
        >
          Mở trang thanh toán
          <ExternalLink size={16} />
        </a>
      </div>
    </Card>
  )
}

function getBillingCycleLabel(value) {
  const labels = {
    FREE: 'miễn phí',
    ONE_TIME: 'một lần',
    MONTHLY: 'tháng',
    YEARLY: 'năm',
    CUSTOM: 'tùy chỉnh',
  }

  return labels[value] || value || 'tháng'
}

function getSubscriptionStatusLabel(subscription) {
  if (!subscription) return 'Chưa có gói'
  if (subscription.autoRenew === false || subscription.cancelledAt) {
    return 'Đã hủy gia hạn, còn quyền truy cập đến ngày hết hạn'
  }
  if (subscription.status === 'ACTIVE') return 'Đang hoạt động'
  if (subscription.status === 'INACTIVE') return 'Không hoạt động'
  return subscription.status || 'Chưa xác định'
}

function getPaymentStatusVariant(status = '') {
  const normalized = status.toUpperCase()
  if (normalized === 'PAID' || normalized === 'APPROVED') return 'success'
  if (normalized === 'CANCELLED' || normalized === 'FAILED') return 'danger'
  return 'warning'
}

function getPaymentStatusLabel(status = '') {
  const labels = {
    PENDING: 'Đang chờ',
    APPROVED: 'Đã duyệt',
    PAID: 'Đã thanh toán',
    CANCELLED: 'Đã hủy',
    FAILED: 'Thất bại',
  }

  return labels[status.toUpperCase()] || status || 'Đang chờ'
}

function getPlanFeatures(plan) {
  const features = [
    `${formatLimit(plan.maxEvents)} sự kiện`,
    `${formatLimit(plan.maxMembers)} thành viên`,
    `${formatLimit(plan.maxAttendees)} người tham dự`,
    `${formatStorageLimit(plan.storageLimit)} lưu trữ`,
    `${plan.aiCreditsLabel || formatLimit(plan.aiCredits)} AI credits`,
  ]

  if (plan.supportLevel) {
    features.push(plan.supportLevel)
  }

  Object.entries(plan.featureTags || {}).forEach(([key, value]) => {
    if (value === false || value === null || value === undefined) return
    features.push(formatFeatureTag(key, value))
  })

  return features
}

function formatFeatureTag(key, value) {
  const labels = {
    taskManagement: 'Quản lý công việc',
    budgetManagement: 'Quản lý ngân sách',
    aiFeatures: 'Tính năng AI',
    qrCheckin: 'QR check-in',
    landingPage: 'Landing page sự kiện',
    autoEmail: 'Email tự động',
    logoUpload: 'Upload logo workspace',
    userSeatAddon: 'Mở rộng số ghế người dùng',
    prioritySupport: 'Hỗ trợ ưu tiên',
    customLimits: 'Hạn mức tùy chỉnh',
    dedicatedInfrastructure: 'Hạ tầng riêng',
    customWorkflow: 'Quy trình tùy chỉnh',
    erpIntegration: 'Tích hợp ERP',
    accountManager: 'Quản lý tài khoản riêng',
    sla: 'SLA',
    eventDurationDays: 'Thời lượng sự kiện',
  }

  if (value === true) return labels[key] || key
  if (key === 'eventDurationDays') return `${labels[key]} ${value} ngày`
  return `${labels[key] || key}: ${value}`
}

function formatLimit(value) {
  if (value === null || value === undefined) return 'Không giới hạn'
  if (Number(value) >= 999999) return 'Không giới hạn'
  return Number(value).toLocaleString('vi-VN')
}

function formatStorageLimit(value) {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 GB'
  const gb = bytes / 1073741824
  if (gb >= 1024) return `${Math.round(gb / 1024)} TB`
  return `${Math.round(gb)} GB`
}

export default SubscriptionPage
