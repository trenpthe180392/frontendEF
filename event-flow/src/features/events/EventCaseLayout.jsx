import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, Eye, EyeOff, MapPin, Users, Wallet } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { eventApi } from '../../api'
import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import Textarea from '../../components/ui/Textarea'
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
      {(_, layoutContext) =>
        isLoading ? (
          <Card>
            <div className="flex min-h-[360px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          </Card>
        ) : eventDetail ? (
          children({
            eventDetail,
            organizationId: Number(organizationId),
            eventId: Number(eventId),
            reloadEvent: loadEvent,
            accessContext: layoutContext?.accessContext,
          })
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

const eventStatusOptions = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PUBLISHED', label: 'Đã công bố' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
]

function getAllowedStatusOptions(currentStatus) {
  const normalized = String(currentStatus || 'DRAFT').toUpperCase()
  const nextByStatus = { DRAFT: 'PUBLISHED', PUBLISHED: 'ONGOING', ONGOING: 'COMPLETED' }
  const allowed = new Set([normalized, nextByStatus[normalized]])
  return eventStatusOptions.filter((option) => allowed.has(option.value))
}

export function EventInfoPanel({ eventDetail, organizationId, onError, onSuccess, onReload }) {
  const navigate = useNavigate()
  const [statusDraft, setStatusDraft] = useState(String(eventDetail.status || 'draft').toUpperCase())
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  async function handleUpdateStatus() {
    if (!eventDetail?.eventId || statusDraft.toLowerCase() === eventDetail.status) return

    setIsUpdatingStatus(true)
    onError?.(null)
    onSuccess?.(null)

    try {
      await eventApi.updateStatus(eventDetail.eventId, statusDraft)
      onSuccess?.('Đã cập nhật trạng thái sự kiện')
      await onReload?.()
    } catch (err) {
      onError?.(getErrorMessage(err))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function handleCancelEvent() {
    if (!cancelReason.trim()) {
      setCancelReasonError('Vui lòng nhập lý do hủy sự kiện.')
      return
    }

    setIsCancelling(true)
    setCancelReasonError('')
    onError?.(null)
    onSuccess?.(null)

    try {
      await eventApi.cancel(eventDetail.eventId, cancelReason.trim())
      onSuccess?.('Sự kiện đã được hủy và lưu lý do để đối soát.')
      await onReload?.()
    } catch (err) {
      onError?.(getErrorMessage(err))
    } finally {
      setIsCancelling(false)
    }
  }

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
            {eventDetail.visible && eventDetail.permissionScope === 'PUBLIC' ? 'Công khai' : 'Nội bộ'}
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
      <div className="grid grid-cols-1 gap-4 p-5 text-sm md:grid-cols-1">
        <InfoPill icon={<Wallet size={16} />} label="Ngân sách dự kiến" value={formatCurrency(eventDetail.estimatedBudget)} />
      </div>
      <div className="border-t border-neutral-100 p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Trạng thái sự kiện</p>
            <div className="mt-2 max-w-xs">
              <Select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
                {getAllowedStatusOptions(eventDetail.status).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.value})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button
            type="button"
            loading={isUpdatingStatus}
            disabled={statusDraft.toLowerCase() === eventDetail.status || ['cancelled', 'deleted'].includes(eventDetail.status)}
            onClick={handleUpdateStatus}
          >
            Cập nhật trạng thái
          </Button>
        </div>
        {!['completed', 'cancelled', 'deleted'].includes(eventDetail.status) ? (
          <div className="mt-5 rounded-xl border border-danger/20 bg-danger-bg p-4">
            <p className="font-semibold text-neutral-900">Hủy sự kiện</p>
            <p className="mt-1 text-sm text-neutral-600">Hủy là trạng thái kết thúc và phải lưu lý do phục vụ audit vận hành.</p>
            <div className="mt-3">
              <Textarea
                value={cancelReason}
                onChange={(event) => {
                  setCancelReason(event.target.value)
                  setCancelReasonError('')
                }}
                error={cancelReasonError}
                placeholder="Lý do hủy sự kiện"
              />
              {cancelReasonError ? <p className="mt-1 text-sm text-danger">{cancelReasonError}</p> : null}
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="button" variant="danger" loading={isCancelling} onClick={handleCancelEvent}>
                Hủy sự kiện
              </Button>
            </div>
          </div>
        ) : eventDetail.status === 'cancelled' ? (
          <div className="mt-5 rounded-xl border border-danger/20 bg-danger-bg p-4 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">Sự kiện đã hủy</p>
            <p className="mt-1">{eventDetail.cancelReason || 'Không có lý do được ghi nhận.'}</p>
            {eventDetail.cancelledAt ? <p className="mt-1 text-neutral-500">Thời điểm hủy: {formatDateTime(eventDetail.cancelledAt)}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function EventWorkspaceHeader({ title, actions = null }) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
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
