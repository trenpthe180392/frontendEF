import { useEffect, useState } from 'react'
import { ArrowRight, Building2, CheckCircle2, CreditCard, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import { subscriptionApi } from '../api'
import AlertBanner from '../components/feedback/AlertBanner'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import useAuthStore from '../store/authStore'
import { getErrorMessage } from '../utils'
import { formatCurrency } from '../utils/dateFormat'

function PricingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [plans, setPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadPlans() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await subscriptionApi.getPlans()
        if (isMounted) {
          setPlans(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'Không tải được bảng giá'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPlans()

    return () => {
      isMounted = false
    }
  }, [])

  const primaryCta = isAuthenticated ? '/subscription' : '/register'

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-700">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={isAuthenticated ? '/organizations' : '/login'} className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm">
              <Zap size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-neutral-900">EventFlow</p>
              <p className="truncate text-xs font-medium text-neutral-500">Pricing for event workspaces</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={isAuthenticated ? '/subscription' : '/login'}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark"
            >
              {isAuthenticated ? 'Quản lý gói' : 'Đăng nhập'}
            </Link>
            <Link
              to={primaryCta}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-light"
            >
              Bắt đầu
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <div>
            <Badge variant="info">Workspace billing</Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-neutral-900 md:text-5xl">Gói cho cá nhân, nhóm nhỏ và doanh nghiệp tổ chức sự kiện</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600 md:text-base">
              Mỗi gói áp dụng cho một workspace. Workspace có thể là không gian cá nhân, team dự án, câu lạc bộ, agency sự kiện hoặc tổ chức lớn.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PricingSignal icon={<Building2 size={18} />} label="Không cần công ty" value="Tạo workspace cá nhân" />
            <PricingSignal icon={<CreditCard size={18} />} label="Billing rõ ràng" value="Gắn với workspace" />
            <PricingSignal icon={<ShieldCheck size={18} />} label="Sẵn sàng mở rộng" value="Thêm team khi cần" />
          </div>
        </div>

        <div className="mt-8">
          <AlertBanner variant="error" message={error} />
        </div>

        {isLoading ? (
          <div className="mt-8 flex min-h-[360px] items-center justify-center rounded-xl border border-neutral-200 bg-white">
            <div className="flex flex-col items-center gap-2">
              <Spinner size="lg" />
              <p className="text-sm text-neutral-500">Đang tải bảng giá...</p>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6">
            <EmptyState
              icon={<CreditCard size={28} />}
              title="Chưa có gói khả dụng"
              description="Bảng giá sẽ hiển thị sau khi backend publish subscription plans."
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PricingPlanCard key={plan.id} plan={plan} ctaPath={primaryCta} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function PricingSignal({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="mt-3 text-xs font-bold uppercase text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function PricingPlanCard({ plan, ctaPath }) {
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

  return (
    <article className="flex min-h-[430px] flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-neutral-900">{plan.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase text-neutral-500">{getPlanAudience(plan)}</p>
        </div>
        <Sparkles size={18} className="text-primary" />
      </div>

      <div className="mt-5">
        <span className="text-3xl font-bold text-neutral-900">{formatCurrency(plan.price)}</span>
        <span className="text-sm text-neutral-500"> / {getBillingCycleLabel(plan.billingCycle)}</span>
      </div>

      <ul className="mt-5 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={`${plan.id}-${feature}`} className="flex items-start gap-2 text-sm text-neutral-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to={ctaPath}
        className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-light"
      >
        Chọn gói
        <ArrowRight size={16} />
      </Link>
    </article>
  )
}

function getPlanAudience(plan) {
  if (plan.targetAudience) return plan.targetAudience
  if (plan.planType === 'ENTERPRISE') return 'Enterprise'
  if (plan.planType === 'EVENT_ONE_TIME') return 'Theo từng sự kiện'
  if (plan.billingCycle === 'FREE') return 'Cá nhân và nhóm nhỏ'
  return 'Workspace đang phát triển'
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

export default PricingPage
