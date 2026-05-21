import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, Eye, EyeOff, MapPin, Users, Wallet } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { eventApi } from '../../api'
import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getErrorMessage } from '../../utils'
import { formatCurrency, formatDateTime } from '../../utils/dateFormat'
import { normalizeOrganizationEvent } from '../../utils/organizationMappers'
import { statusVariant } from '../organizations/organizationConstants'
import OrganizationCaseLayout from '../organizations/OrganizationCaseLayout'
import { getEventStatusLabel } from './eventConstants'

function EventCaseLayout({ children, error, successMessage, onError }) {
  const { organizationId, eventId } = useParams()
  const [eventDetail, setEventDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadEvent = useCallback(async () => {
    setIsLoading(true)
    onError(null)

    try {
      const response = await eventApi.getByOrganization(Number(organizationId))
      const foundEvent = (response.data || [])
        .map(normalizeOrganizationEvent)
        .find((item) => Number(item.eventId) === Number(eventId))

      setEventDetail(foundEvent || null)
      if (!foundEvent) onError('Không tìm thấy sự kiện trong tổ chức này')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [eventId, organizationId, onError])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={onError}>
      {() =>
        isLoading ? (
          <Card>
            <div className="flex min-h-[360px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          </Card>
        ) : eventDetail ? (
          children({ eventDetail, organizationId: Number(organizationId), eventId: Number(eventId), reloadEvent: loadEvent })
        ) : (
          <Card>
            <EmptyState
              icon={<CalendarDays size={24} />}
              title="Không tìm thấy sự kiện"
              description="Sự kiện có thể đã bị xóa hoặc bạn không có quyền xem trong tổ chức này."
            />
          </Card>
        )
      }
    </OrganizationCaseLayout>
  )
}

export function EventInfoPanel({ eventDetail, organizationId }) {
  const navigate = useNavigate()

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 bg-neutral-900 p-5 text-white md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(`/organizations/${organizationId}/events`)}
          >
            Danh sách sự kiện
          </Button>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700">
            {eventDetail.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            {eventDetail.visible ? 'Công khai' : 'Nội bộ'}
          </span>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[eventDetail.status] || 'default'}>
              {getEventStatusLabel(eventDetail.status)}
            </Badge>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              {eventDetail.eventType || 'Khác'}
            </span>
          </div>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight md:text-5xl">{eventDetail.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-100 md:text-base">
            {eventDetail.description || 'Chưa có mô tả'}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <InfoPill icon={<CalendarDays size={16} />} label="Bắt đầu" value={formatDateTime(eventDetail.startTime)} dark />
            <InfoPill icon={<CheckCircle2 size={16} />} label="Kết thúc" value={formatDateTime(eventDetail.endTime)} dark />
            <InfoPill icon={<MapPin size={16} />} label="Địa điểm" value={eventDetail.location || 'Chưa có'} dark />
            <InfoPill icon={<Users size={16} />} label="Sức chứa tối đa" value={eventDetail.capacity || 'Không giới hạn'} dark />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 text-sm md:grid-cols-3">
        <InfoPill icon={<CalendarDays size={16} />} label="Mở đăng ký" value={formatDateTime(eventDetail.registrationStart)} />
        <InfoPill icon={<CheckCircle2 size={16} />} label="Hạn đăng ký" value={formatDateTime(eventDetail.registrationDeadline)} />
        <InfoPill icon={<Wallet size={16} />} label="Ngân sách dự kiến" value={formatCurrency(eventDetail.estimatedBudget)} />
      </div>
    </section>
  )
}

export function EventWorkspaceHeader({ title, description, icon, actions = null, stats = [] }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {stats.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs font-medium text-neutral-500">{stat.label}</p>
              <p className="mt-1 text-xl font-bold text-neutral-900">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function InfoPill({ icon, label, value, dark = false }) {
  return (
    <div
      className={
        dark
          ? 'flex items-center gap-3 rounded-xl border border-white/20 bg-white/15 px-3 py-2 backdrop-blur'
          : 'flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2'
      }
    >
      <span className="text-primary">{icon}</span>
      <span className="min-w-0">
        <span className={dark ? 'block text-xs font-medium text-neutral-200' : 'block text-xs font-medium text-neutral-500'}>
          {label}
        </span>
        <span className={dark ? 'block truncate font-semibold text-white' : 'block truncate font-semibold text-neutral-900'}>
          {value}
        </span>
      </span>
    </div>
  )
}

export default EventCaseLayout
