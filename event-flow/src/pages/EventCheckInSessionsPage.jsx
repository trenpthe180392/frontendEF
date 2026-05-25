import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Eye, Pencil, Play, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { checkInApi } from '../api'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
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
import { toApiDateTime, toDateTimeLocalValue } from '../features/events/eventPageUtils'
import { getErrorMessage, getFieldErrors, isSubscriptionGateError } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const emptySessionForm = {
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  status: 'SCHEDULED',
}

const sessionStatusOptions = ['SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED']

const sessionStatusLabels = {
  SCHEDULED: 'Đã lên lịch',
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
}

const sessionStatusVariants = {
  SCHEDULED: 'info',
  OPEN: 'success',
  CLOSED: 'default',
  CANCELLED: 'danger',
}

const recordStatusLabels = {
  CHECKED_IN: 'Đã check-in',
  VOIDED: 'Đã hủy',
}

const recordStatusVariants = {
  CHECKED_IN: 'success',
  VOIDED: 'danger',
}

const methodLabels = {
  QR: 'QR',
  MANUAL: 'Thủ công',
}

function EventCheckInSessionsContent({ organizationId, eventId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [records, setRecords] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [form, setForm] = useState(emptySessionForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRecordsLoading, setIsRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [pendingDeleteSession, setPendingDeleteSession] = useState(null)
  const [deletingSessionId, setDeletingSessionId] = useState(null)
  const [subscriptionGateError, setSubscriptionGateError] = useState(null)
  const hasSubscriptionGateError = isSubscriptionGateError(subscriptionGateError)

  async function loadSessions() {
    setIsLoading(true)
    onError(null)
    setSubscriptionGateError(null)

    try {
      const data = await checkInApi.sessions.list(eventId)
      const nextSessions = (Array.isArray(data) ? data : []).map(normalizeSession)
      setSessions(nextSessions)

      if (selectedSession?.id) {
        const refreshedSelectedSession = nextSessions.find((session) => Number(session.id) === Number(selectedSession.id))
        setSelectedSession(refreshedSelectedSession || null)
      }
    } catch (err) {
      if (isSubscriptionGateError(err)) {
        setSubscriptionGateError(err)
      } else {
        onError(getErrorMessage(err))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const openCount = useMemo(() => sessions.filter((session) => session.status === 'OPEN').length, [sessions])
  const scheduledCount = useMemo(() => sessions.filter((session) => session.status === 'SCHEDULED').length, [sessions])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'Vui lòng nhập tên phiên check-in'
    if (form.name.trim().length > 255) nextErrors.name = 'Tên phiên tối đa 255 ký tự'
    if (form.location.trim().length > 255) nextErrors.location = 'Địa điểm tối đa 255 ký tự'
    if (!sessionStatusOptions.includes(form.status)) nextErrors.status = 'Trạng thái không hợp lệ'

    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      nextErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      startTime: toApiDateTime(form.startTime),
      endTime: toApiDateTime(form.endTime),
      location: form.location.trim() || null,
      status: form.status,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      if (editingSession?.id) {
        await checkInApi.sessions.update(eventId, editingSession.id, buildPayload())
        onSuccess('Đã cập nhật phiên check-in')
      } else {
        await checkInApi.sessions.create(eventId, buildPayload())
        onSuccess('Đã tạo phiên check-in')
      }

      closeForm()
      await loadSessions()
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
      if (isSubscriptionGateError(err)) {
        setSubscriptionGateError(err)
      } else {
        onError(getErrorMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function openCreateForm() {
    setEditingSession(null)
    setForm(emptySessionForm)
    setErrors({})
    setIsFormOpen(true)
  }

  function openEditForm(session) {
    setEditingSession(session)
    setForm({
      name: session.name || '',
      description: session.description || '',
      startTime: toDateTimeLocalValue(session.startTime),
      endTime: toDateTimeLocalValue(session.endTime),
      location: session.location || '',
      status: session.status || 'SCHEDULED',
    })
    setErrors({})
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingSession(null)
    setForm(emptySessionForm)
    setErrors({})
    setIsFormOpen(false)
  }

  async function handleSelectSession(session) {
    setSelectedSession(session)
    setRecords([])
    setRecordsError(null)
    setIsRecordsLoading(true)

    try {
      const data = await checkInApi.records.listBySession(eventId, session.id)
      setRecords((Array.isArray(data) ? data : []).map(normalizeRecord))
    } catch (err) {
      setRecordsError(getErrorMessage(err))
    } finally {
      setIsRecordsLoading(false)
    }
  }

  function handleOpenScanner(session) {
    navigate(`/organizations/${organizationId}/events/${eventId}/check-in/scanner?sessionId=${session.id}`)
  }

  async function handleConfirmDeleteSession() {
    if (!pendingDeleteSession?.id) return

    setDeletingSessionId(pendingDeleteSession.id)
      onError(null)
    onSuccess(null)

    try {
      await checkInApi.sessions.delete(eventId, pendingDeleteSession.id)
      if (selectedSession?.id === pendingDeleteSession.id) {
        setSelectedSession(null)
        setRecords([])
      }
      setPendingDeleteSession(null)
      await loadSessions()
      onSuccess('Đã xóa phiên check-in')
    } catch (err) {
      if (isSubscriptionGateError(err)) {
        setSubscriptionGateError(err)
      } else {
        onError(getErrorMessage(err))
      }
    } finally {
      setDeletingSessionId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Đang tải phiên check-in...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Phiên check-in"
        description="Tạo các cửa sổ check-in, mở scanner theo từng phiên và theo dõi record đã ghi nhận."
        icon={<ClipboardList size={24} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={loadSessions}>
              Tải lại
            </Button>
            <Button
              type="button"
              variant={isFormOpen ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={isFormOpen ? <X size={16} /> : <Plus size={16} />}
              onClick={isFormOpen ? closeForm : openCreateForm}
              disabled={hasSubscriptionGateError}
            >
              {isFormOpen ? 'Đóng biểu mẫu' : 'Tạo phiên'}
            </Button>
          </div>
        }
        stats={[
          { label: 'Tổng phiên', value: sessions.length },
          { label: 'Đang mở', value: openCount },
          { label: 'Đã lên lịch', value: scheduledCount },
          { label: 'Records đang xem', value: records.length },
        ]}
      />

      {hasSubscriptionGateError ? <SubscriptionGateBanner error={subscriptionGateError} organizationId={organizationId} /> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <Card title="Danh sách phiên">
          {isFormOpen ? (
            <SessionForm
              form={form}
              errors={errors}
              editingSession={editingSession}
              isSubmitting={isSubmitting}
              onChange={handleChange}
              onCancel={closeForm}
              onSubmit={handleSubmit}
            />
          ) : null}

          {sessions.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={24} />}
              title="Chưa có phiên check-in"
              description="Tạo phiên đầu tiên để mở scanner và ghi nhận người tham dự theo từng cửa check-in."
              action={
                <Button type="button" leftIcon={<Plus size={16} />} onClick={openCreateForm} disabled={hasSubscriptionGateError}>
                  Tạo phiên
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  selected={selectedSession?.id === session.id}
                  deleting={deletingSessionId === session.id}
                  onEdit={openEditForm}
                  onDelete={setPendingDeleteSession}
                  onOpenScanner={handleOpenScanner}
                  onViewRecords={handleSelectSession}
                />
              ))}
            </div>
          )}
        </Card>

        <RecordsPanel
          session={selectedSession}
          records={records}
          isLoading={isRecordsLoading}
          error={recordsError}
          onRefresh={() => selectedSession && handleSelectSession(selectedSession)}
        />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteSession)}
        title="Xóa phiên check-in?"
        description={`Xóa phiên ${pendingDeleteSession?.name || 'này'}? Backend hiện sẽ đánh dấu phiên là CANCELLED.`}
        loading={Boolean(deletingSessionId)}
        onClose={() => setPendingDeleteSession(null)}
        onConfirm={handleConfirmDeleteSession}
      />
    </div>
  )
}

function SessionForm({ form, errors, editingSession, isSubmitting, onChange, onCancel, onSubmit }) {
  return (
    <form className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormField label="Tên phiên" required error={errors.name}>
          <Input name="name" value={form.name} onChange={onChange} error={errors.name} placeholder="Cổng check-in chính" />
        </FormField>
        <FormField label="Địa điểm" error={errors.location}>
          <Input name="location" value={form.location} onChange={onChange} error={errors.location} placeholder="Sảnh A" />
        </FormField>
        <FormField label="Bắt đầu" error={errors.startTime}>
          <Input name="startTime" type="datetime-local" value={form.startTime} onChange={onChange} error={errors.startTime} />
        </FormField>
        <FormField label="Kết thúc" error={errors.endTime}>
          <Input name="endTime" type="datetime-local" value={form.endTime} onChange={onChange} error={errors.endTime} />
        </FormField>
        <FormField label="Trạng thái" required error={errors.status}>
          <Select name="status" value={form.status} onChange={onChange} error={errors.status}>
            {sessionStatusOptions.map((status) => (
              <option key={status} value={status}>
                {sessionStatusLabels[status]} ({status})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Mô tả" error={errors.description}>
          <Textarea
            name="description"
            value={form.description}
            onChange={onChange}
            error={errors.description}
            placeholder="Ghi chú phạm vi phiên, cổng check-in, nhân sự phụ trách..."
          />
        </FormField>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting} leftIcon={editingSession ? <Pencil size={16} /> : <Plus size={16} />}>
          {editingSession ? 'Lưu thay đổi' : 'Tạo phiên'}
        </Button>
      </div>
    </form>
  )
}

function SessionCard({ session, selected, deleting, onEdit, onDelete, onOpenScanner, onViewRecords }) {
  return (
    <article className={selected ? 'rounded-xl border border-primary bg-primary-bg p-4' : 'rounded-xl border border-neutral-200 bg-white p-4'}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900">{session.name}</h2>
            <Badge variant={sessionStatusVariants[session.status] || 'default'}>
              {sessionStatusLabels[session.status] || session.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-500">{session.location || 'Chưa có địa điểm'}</p>
          <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{session.description || 'Chưa có mô tả phiên.'}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-neutral-500 sm:grid-cols-2">
            <p>Bắt đầu: <span className="font-semibold text-neutral-700">{formatDateTime(session.startTime)}</span></p>
            <p>Kết thúc: <span className="font-semibold text-neutral-700">{formatDateTime(session.endTime)}</span></p>
            <p>Người tạo: <span className="font-semibold text-neutral-700">{session.createdBy || 'Chưa có'}</span></p>
            <p>Cập nhật: <span className="font-semibold text-neutral-700">{formatDateTime(session.updateAt || session.createAt)}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="primary" size="sm" leftIcon={<Play size={16} />} onClick={() => onOpenScanner(session)}>
            Scanner
          </Button>
          <Button type="button" variant="secondary" size="sm" leftIcon={<Eye size={16} />} onClick={() => onViewRecords(session)}>
            Records
          </Button>
          <Button type="button" variant="secondary" size="sm" leftIcon={<Pencil size={16} />} onClick={() => onEdit(session)}>
            Sửa
          </Button>
          <Button type="button" variant="ghost" size="sm" leftIcon={<Trash2 size={16} />} loading={deleting} onClick={() => onDelete(session)}>
            Xóa
          </Button>
        </div>
      </div>
    </article>
  )
}

function RecordsPanel({ session, records, isLoading, error, onRefresh }) {
  return (
    <Card
      title={session ? `Records: ${session.name}` : 'Records phiên'}
      headerRight={
        session ? (
          <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={onRefresh}>
            Tải lại
          </Button>
        ) : null
      }
    >
      {!session ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Chưa chọn phiên"
          description="Chọn Records ở một phiên check-in để xem danh sách người đã được ghi nhận."
        />
      ) : isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Không thể tải records"
          description={error}
          action={
            <Button type="button" variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={onRefresh}>
              Thử lại
            </Button>
          }
        />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Chưa có record"
          description="Khi scanner hoặc check-in thủ công ghi nhận thành công, record sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <article key={record.id} className="rounded-xl border border-neutral-200 bg-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900">{record.attendeeName}</p>
                  <p className="mt-1 text-xs text-neutral-500">{record.attendeeEmail || 'Chưa có email'} - {record.attendeePhone || 'Chưa có số điện thoại'}</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-neutral-700">{record.inviteCode || 'Chưa có mã mời'}</p>
                </div>
                <Badge variant={recordStatusVariants[record.status] || 'default'}>{recordStatusLabels[record.status] || record.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-neutral-500 sm:grid-cols-2">
                <p>Thời điểm: <span className="font-semibold text-neutral-700">{formatDateTime(record.checkedInAt)}</span></p>
                <p>Phương thức: <span className="font-semibold text-neutral-700">{methodLabels[record.method] || record.method}</span></p>
                <p>Nhân sự: <span className="font-semibold text-neutral-700">{record.checkedInBy || 'Chưa có'}</span></p>
                <p>Ghi chú: <span className="font-semibold text-neutral-700">{record.note || 'Không có'}</span></p>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}

function normalizeSession(session) {
  return {
    id: session.id,
    eventId: session.eventId,
    name: session.name || 'Phiên check-in',
    description: session.description || '',
    startTime: session.startTime || null,
    endTime: session.endTime || null,
    location: session.location || '',
    status: session.status || 'SCHEDULED',
    createdBy: session.createdBy || null,
    createAt: session.createAt || null,
    updateAt: session.updateAt || null,
  }
}

function normalizeRecord(record) {
  return {
    id: record.id,
    sessionId: record.sessionId,
    attendeeId: record.attendeeId,
    attendeeName: record.attendeeName || 'Người tham dự',
    attendeeEmail: record.attendeeEmail || '',
    attendeePhone: record.attendeePhone || '',
    inviteCode: record.inviteCode || '',
    checkedInAt: record.checkedInAt || null,
    checkedInBy: record.checkedInBy || null,
    method: record.method || 'MANUAL',
    status: record.status || 'CHECKED_IN',
    note: record.note || '',
    createAt: record.createAt || null,
    updateAt: record.updateAt || null,
  }
}

function EventCheckInSessionsPage() {
  const { organizationId, eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <EventCheckInSessionsContent
          organizationId={Number(organizationId)}
          eventId={Number(eventId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default EventCheckInSessionsPage
