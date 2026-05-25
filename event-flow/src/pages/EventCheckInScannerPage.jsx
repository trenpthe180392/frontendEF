import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Info, RefreshCw, ScanLine, Search, UserCheck } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'

import { checkInApi } from '../api'
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
import { getErrorMessage, getFieldErrors, isSubscriptionGateError } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const emptyScanForm = {
  lookupType: 'qrToken',
  lookupValue: '',
  note: '',
}

const emptyManualForm = {
  inviteCode: '',
  email: '',
  phone: '',
  note: '',
}

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

const resultStatusLabels = {
  CHECKED_IN: 'Đã check-in',
  DUPLICATE: 'Đã check-in trước đó',
}

const methodLabels = {
  QR: 'QR',
  MANUAL: 'Thủ công',
}

function EventCheckInScannerContent({ organizationId, eventId }) {
  const [searchParams] = useSearchParams()
  const initialSessionId = searchParams.get('sessionId') || ''
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId)
  const [scanForm, setScanForm] = useState(emptyScanForm)
  const [manualForm, setManualForm] = useState(emptyManualForm)
  const [scanErrors, setScanErrors] = useState({})
  const [manualErrors, setManualErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isManualSubmitting, setIsManualSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [subscriptionGateError, setSubscriptionGateError] = useState(null)
  const hasSubscriptionGateError = isSubscriptionGateError(subscriptionGateError)

  async function loadSessions() {
    setIsLoading(true)
    setLoadError(null)
    setSubscriptionGateError(null)

    try {
      const data = await checkInApi.sessions.list(eventId)
      const nextSessions = (Array.isArray(data) ? data : []).map(normalizeSession)
      setSessions(nextSessions)

      if (initialSessionId && nextSessions.some((session) => String(session.id) === String(initialSessionId))) {
        setSelectedSessionId(initialSessionId)
      } else if (!selectedSessionId && nextSessions.length > 0) {
        const openSession = nextSessions.find((session) => session.status === 'OPEN')
        setSelectedSessionId(String(openSession?.id || nextSessions[0].id))
      }
    } catch (err) {
      if (isSubscriptionGateError(err)) {
        setSubscriptionGateError(err)
      } else {
        setLoadError(getErrorMessage(err))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const selectedSession = useMemo(
    () => sessions.find((session) => String(session.id) === String(selectedSessionId)) || null,
    [selectedSessionId, sessions]
  )
  const openSessions = sessions.filter((session) => session.status === 'OPEN').length
  const isSessionBlocked = selectedSession && ['CLOSED', 'CANCELLED'].includes(selectedSession.status)

  function handleSessionChange(event) {
    setSelectedSessionId(event.target.value)
    clearFeedback()
  }

  function handleScanChange(event) {
    const { name, value } = event.target
    setScanForm((current) => ({ ...current, [name]: value }))
    setScanErrors((current) => ({ ...current, [name]: null }))
    setLastResult(null)
  }

  function handleManualChange(event) {
    const { name, value } = event.target
    setManualForm((current) => ({ ...current, [name]: value }))
    setManualErrors((current) => ({ ...current, [name]: null }))
    setLastResult(null)
  }

  function clearFeedback() {
    setLastResult(null)
    setScanErrors({})
    setManualErrors({})
  }

  function validateSession(nextErrors) {
    if (!selectedSessionId) nextErrors.sessionId = 'Vui lòng chọn phiên check-in'
    if (isSessionBlocked) nextErrors.sessionId = 'Phiên đã đóng hoặc đã hủy, backend sẽ không cho check-in'
  }

  function validateScanForm() {
    const nextErrors = {}
    validateSession(nextErrors)
    if (!scanForm.lookupValue.trim()) nextErrors.lookupValue = 'Vui lòng nhập QR token hoặc mã mời'
    if (scanForm.lookupType === 'qrToken' && scanForm.lookupValue.trim().length > 500) {
      nextErrors.lookupValue = 'QR token tối đa 500 ký tự'
    }
    if (scanForm.lookupType === 'inviteCode' && scanForm.lookupValue.trim().length > 100) {
      nextErrors.lookupValue = 'Mã mời tối đa 100 ký tự'
    }
    if (scanForm.note.trim().length > 500) nextErrors.note = 'Ghi chú tối đa 500 ký tự'

    setScanErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateManualForm() {
    const nextErrors = {}
    const email = manualForm.email.trim()
    validateSession(nextErrors)
    if (!manualForm.inviteCode.trim() && !email && !manualForm.phone.trim()) {
      nextErrors.lookup = 'Nhập ít nhất mã mời, email hoặc số điện thoại'
    }
    if (manualForm.inviteCode.trim().length > 100) nextErrors.inviteCode = 'Mã mời tối đa 100 ký tự'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email không hợp lệ'
    if (email.length > 255) nextErrors.email = 'Email tối đa 255 ký tự'
    if (manualForm.phone.trim().length > 50) nextErrors.phone = 'Số điện thoại tối đa 50 ký tự'
    if (manualForm.note.trim().length > 500) nextErrors.note = 'Ghi chú tối đa 500 ký tự'

    setManualErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleScanSubmit(event) {
    event.preventDefault()
    clearFeedback()
    if (!validateScanForm()) return

    setIsScanning(true)

    try {
      const payload = {
        qrToken: scanForm.lookupType === 'qrToken' ? scanForm.lookupValue.trim() : null,
        inviteCode: scanForm.lookupType === 'inviteCode' ? scanForm.lookupValue.trim() : null,
        note: scanForm.note.trim() || null,
      }
      const data = await checkInApi.scan.sessionQrOrInvite(eventId, selectedSessionId, payload)
      setLastResult(normalizeResult(data, 'scan'))
      setScanForm(emptyScanForm)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setScanErrors(fieldErrors)
      if (isSubscriptionGateError(err)) setSubscriptionGateError(err)
      setLastResult(createErrorResult(getErrorMessage(err), 'scan'))
    } finally {
      setIsScanning(false)
    }
  }

  async function handleManualSubmit(event) {
    event.preventDefault()
    clearFeedback()
    if (!validateManualForm()) return

    setIsManualSubmitting(true)

    try {
      const payload = {
        inviteCode: manualForm.inviteCode.trim() || null,
        email: manualForm.email.trim() || null,
        phone: manualForm.phone.trim() || null,
        note: manualForm.note.trim() || null,
      }
      const data = await checkInApi.scan.manual(eventId, selectedSessionId, payload)
      setLastResult(normalizeResult(data, 'manual'))
      setManualForm(emptyManualForm)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setManualErrors(fieldErrors)
      if (isSubscriptionGateError(err)) setSubscriptionGateError(err)
      setLastResult(createErrorResult(getErrorMessage(err), 'manual'))
    } finally {
      setIsManualSubmitting(false)
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

  if (loadError) {
    return (
      <Card>
        <EmptyState
          icon={<ScanLine size={24} />}
          title="Không thể tải scanner"
          description={loadError}
          action={
            <Button type="button" variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={loadSessions}>
              Tải lại
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Scanner check-in"
        description="Nhập QR token hoặc mã mời để scan nhanh. Nếu cần đối soát thủ công, dùng form manual theo mã mời, email hoặc số điện thoại."
        icon={<ScanLine size={24} />}
        stats={[
          { label: 'Tổng phiên', value: sessions.length },
          { label: 'Đang mở', value: openSessions },
          { label: 'Phiên đang chọn', value: selectedSession?.name || 'Chưa chọn' },
        ]}
      />

      {hasSubscriptionGateError ? <SubscriptionGateBanner error={subscriptionGateError} organizationId={organizationId} /> : null}

      {hasSubscriptionGateError ? null : sessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck size={24} />}
            title="Chưa có phiên check-in"
            description="Tạo phiên check-in trước khi scan hoặc check-in thủ công."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <Card title="Chọn phiên">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.5fr)]">
                <FormField label="Phiên check-in" required error={scanErrors.sessionId || manualErrors.sessionId}>
                  <Select value={selectedSessionId} onChange={handleSessionChange} error={scanErrors.sessionId || manualErrors.sessionId}>
                    <option value="">Chọn phiên</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name} - {sessionStatusLabels[session.status] || session.status}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Trạng thái phiên</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={sessionStatusVariants[selectedSession?.status] || 'default'}>
                      {sessionStatusLabels[selectedSession?.status] || selectedSession?.status || 'Chưa chọn'}
                    </Badge>
                    {isSessionBlocked ? <Badge variant="danger">Không nhận check-in</Badge> : null}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    {selectedSession?.location || 'Chưa có địa điểm'} - {formatDateTime(selectedSession?.startTime)}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ScanTokenForm
                form={scanForm}
                errors={scanErrors}
                isSubmitting={isScanning}
                disabled={hasSubscriptionGateError}
                onChange={handleScanChange}
                onSubmit={handleScanSubmit}
              />
              <ManualCheckInForm
                form={manualForm}
                errors={manualErrors}
                isSubmitting={isManualSubmitting}
                disabled={hasSubscriptionGateError}
                onChange={handleManualChange}
                onSubmit={handleManualSubmit}
              />
            </div>
          </div>

          <LastResultPanel result={lastResult} selectedSession={selectedSession} />
        </div>
      )}
    </div>
  )
}

function ScanTokenForm({ form, errors, isSubmitting, disabled = false, onChange, onSubmit }) {
  return (
    <Card title="Scan token">
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField label="Loại dữ liệu" required>
          <Select name="lookupType" value={form.lookupType} onChange={onChange}>
            <option value="qrToken">QR token</option>
            <option value="inviteCode">Mã mời</option>
          </Select>
        </FormField>
        <FormField label={form.lookupType === 'qrToken' ? 'QR token' : 'Mã mời'} required error={errors.lookupValue}>
          <Input
            name="lookupValue"
            value={form.lookupValue}
            onChange={onChange}
            error={errors.lookupValue}
            leftIcon={<Search size={16} />}
            placeholder={form.lookupType === 'qrToken' ? 'Dán QR token...' : 'INV-001'}
            autoComplete="off"
          />
        </FormField>
        <FormField label="Ghi chú" error={errors.note}>
          <Textarea
            name="note"
            value={form.note}
            onChange={onChange}
            error={errors.note}
            placeholder="Ghi chú ngắn cho record check-in..."
          />
        </FormField>
        <Button type="submit" className="w-full" loading={isSubmitting} disabled={disabled} leftIcon={<ScanLine size={16} />}>
          Scan
        </Button>
      </form>
    </Card>
  )
}

function ManualCheckInForm({ form, errors, isSubmitting, disabled = false, onChange, onSubmit }) {
  return (
    <Card title="Check-in thủ công">
      <form className="space-y-4" onSubmit={onSubmit}>
        {errors.lookup ? <p className="rounded-lg border border-danger/20 bg-danger-bg p-3 text-sm font-medium text-danger">{errors.lookup}</p> : null}
        <FormField label="Mã mời" error={errors.inviteCode}>
          <Input name="inviteCode" value={form.inviteCode} onChange={onChange} error={errors.inviteCode} placeholder="INV-001" />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <Input name="email" type="email" value={form.email} onChange={onChange} error={errors.email} placeholder="attendee@example.com" />
        </FormField>
        <FormField label="Số điện thoại" error={errors.phone}>
          <Input name="phone" value={form.phone} onChange={onChange} error={errors.phone} placeholder="090..." />
        </FormField>
        <FormField label="Ghi chú" error={errors.note}>
          <Textarea name="note" value={form.note} onChange={onChange} error={errors.note} placeholder="Lý do check-in thủ công..." />
        </FormField>
        <Button type="submit" className="w-full" loading={isSubmitting} disabled={disabled} leftIcon={<UserCheck size={16} />}>
          Check-in thủ công
        </Button>
      </form>
    </Card>
  )
}

function LastResultPanel({ result, selectedSession }) {
  if (!result) {
    return (
      <Card title="Kết quả cuối">
        <EmptyState
          icon={<Info size={24} />}
          title="Chưa có lượt check-in"
          description="Sau mỗi lần scan hoặc check-in thủ công, kết quả mới nhất sẽ hiển thị tại đây."
        />
      </Card>
    )
  }

  const isError = result.type === 'error'
  const isDuplicate = result.duplicate
  const variant = isError ? 'danger' : isDuplicate ? 'warning' : 'success'
  const Icon = isError ? Info : CheckCircle2

  return (
    <Card title="Kết quả cuối">
      <div className="space-y-4">
        <div className={`rounded-xl border p-4 ${isError ? 'border-danger/20 bg-danger-bg text-danger' : isDuplicate ? 'border-warning/20 bg-warning-bg text-warning' : 'border-success/20 bg-success-bg text-success'}`}>
          <div className="flex items-start gap-3">
            <Icon size={22} className="mt-0.5 shrink-0" />
            <div>
              <Badge variant={variant}>{resultStatusLabels[result.status] || result.status || (isError ? 'Lỗi' : 'Thành công')}</Badge>
              <p className="mt-2 text-sm font-semibold">{result.message}</p>
              <p className="mt-1 text-xs opacity-80">Nguồn thao tác: {result.source === 'manual' ? 'Manual' : 'Scan'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Phiên</p>
          <p className="mt-1 font-semibold text-neutral-900">{result.session?.name || selectedSession?.name || 'Chưa có'}</p>
          <p className="mt-1 text-xs text-neutral-500">{result.session?.location || selectedSession?.location || 'Chưa có địa điểm'}</p>
        </div>

        {result.attendee ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Người tham dự</p>
            <p className="mt-1 font-semibold text-neutral-900">{result.attendee.fullName}</p>
            <p className="mt-1 text-sm text-neutral-600">{result.attendee.email || 'Chưa có email'}</p>
            <p className="mt-1 text-sm text-neutral-600">{result.attendee.phone || 'Chưa có số điện thoại'}</p>
            <p className="mt-2 font-mono text-xs font-semibold text-neutral-700">{result.attendee.inviteCode}</p>
          </div>
        ) : null}

        {result.record ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Record</p>
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
              <p>Thời điểm: <span className="font-semibold text-neutral-900">{formatDateTime(result.record.checkedInAt)}</span></p>
              <p>Phương thức: <span className="font-semibold text-neutral-900">{methodLabels[result.record.method] || result.record.method}</span></p>
              <p>Nhân sự: <span className="font-semibold text-neutral-900">{result.record.checkedInBy || 'Chưa có'}</span></p>
              <p>Ghi chú: <span className="font-semibold text-neutral-900">{result.record.note || 'Không có'}</span></p>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

function normalizeSession(session) {
  return {
    id: session.id,
    name: session.name || 'Phiên check-in',
    location: session.location || '',
    status: session.status || 'SCHEDULED',
    startTime: session.startTime || null,
  }
}

function normalizeResult(data, source) {
  return {
    type: data?.duplicate ? 'warning' : 'success',
    source,
    status: data?.status || 'CHECKED_IN',
    duplicate: Boolean(data?.duplicate),
    message: data?.message || (data?.duplicate ? 'Người tham dự đã check-in trong phiên này' : 'Check-in thành công'),
    attendee: data?.attendee || null,
    session: data?.session || null,
    record: data?.record || null,
  }
}

function createErrorResult(message, source) {
  return {
    type: 'error',
    source,
    status: 'ERROR',
    duplicate: false,
    message,
    attendee: null,
    session: null,
    record: null,
  }
}

function EventCheckInScannerPage() {
  const { organizationId, eventId } = useParams()
  const [error, setError] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={null} onError={setError}>
      {() => <EventCheckInScannerContent organizationId={Number(organizationId)} eventId={Number(eventId)} />}
    </EventCaseLayout>
  )
}

export default EventCheckInScannerPage
