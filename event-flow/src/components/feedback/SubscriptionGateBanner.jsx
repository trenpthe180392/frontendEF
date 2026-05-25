import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getSubscriptionGateInfo } from '../../utils/subscriptionGate'
import { cn } from '../../utils'

/**
 * @param {object} props
 * @param {object} props.error
 * @param {number|string} props.organizationId
 * @param {string} props.className
 */
function SubscriptionGateBanner({ error, organizationId = null, className = '' }) {
  const gateInfo = getSubscriptionGateInfo(error, organizationId)

  if (!gateInfo) return null

  return (
    <section className={cn('rounded-xl border border-primary/20 bg-primary-bg p-4 text-neutral-700 shadow-sm', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900">Tính năng cần nâng cấp gói</p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">{gateInfo.message}</p>
            {gateInfo.errorCode ? (
              <p className="mt-2 text-xs font-semibold uppercase text-neutral-500">{gateInfo.errorCode}</p>
            ) : null}
          </div>
        </div>

        {gateInfo.subscriptionPath ? (
          <Link
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-light"
            to={gateInfo.subscriptionPath}
          >
            Xem gói đăng ký
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
    </section>
  )
}

export default SubscriptionGateBanner
