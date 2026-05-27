import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, RefreshCw, ScanLine } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { checkInApi } from '../api'
import { normalizePageResponse } from '../api/response'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PaginationControls from '../components/ui/PaginationControls'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import Textarea from '../components/ui/Textarea'
import CheckInRecordsPanel from '../features/checkin/CheckInRecordsPanel'
import { emptyScanForm, sessionStatusLabels, sessionStatusVariants } from '../features/checkin/checkInConstants'
import { normalizeRecord, normalizeSession } from '../features/checkin/checkInMappers'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import Badge from '../components/ui/Badge'
import { getErrorMessage, isSubscriptionGateError } from '../utils'

const DEFAULT_RECORDS_PER_PAGE = 10

function EventCheckInRunnerContent({ organizationId, eventId, sessionId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [records, setRecords] = useState([])
  const [recordPage, setRecordPage] = useState(1)
  const [recordPageSize, setRecordPageSize] = useState(DEFAULT_RECORDS_PER_PAGE)
  const [recordTotalPages, setRecordTotalPages] = useState(1)
  const [recordTotal, setRecordTotal] = useState(0)
  const [form, setForm] = useState(emptyScanForm)
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecordsLoading, setIsRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subscriptionGateError, setSubscriptionGateError] = useState(null)
  const hasSubscriptionGateError = isSubscriptionGateError(subscriptionGateError)

  async function loadRecords(nextPage = recordPage, nextSize = recordPageSize) {
    setIsRecordsLoading(true)
    setRecordsError(null)

    try {
      const recordsData = await checkInApi.records.listBySession(eventId, sessionId, { page: nextPage - 1, size: nextSize })
      const page = normalizePageResponse(recordsData, nextSize)
      setRecords(page.items.map(normalizeRecord))
      setRecordTotal(page.total)
      setRecordTotalPages(Math.max(1, page.pages || 1))
      setRecordPage((page.currentPage ?? 0) + 1)
    } catch (err) {
      setRecordsError(getErrorMessage(err))
    } finally {
      setIsRecordsLoading(false)
    }
  }

  async function loadWorkspace() {
    setIsLoading(true)
    onError(null)
    setSubscriptionGateError(null)

    try {
      const sessionData = await checkInApi.sessions.get(eventId, sessionId)
      setSession(normalizeSession(sessionData))
      await loadRecords()
    } catch (err) {
      if (isSubscriptionGateError(err)) setSubscriptionGateError(err)
      else onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, sessionId])

  useEffect(() => {
    if (!isLoading) {
      loadRecords()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordPage, recordPageSize])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
    setResult(null)
  }

  function validateForm() {
    const nextErrors = {}
    if (!session?.id) nextErrors.session = 'Không tìm thấy phiên check-in'
    if (session && session.status !== 'OPEN') nextErrors.session = 'Chỉ check-in khi phiên đang mở'
    if (!form.lookupValue.trim()) nextErrors.lookupValue = form.lookupType === 'qrToken' ? 'Vui lòng quét QR của khách' : 'Vui lòng nhập mã mời'
    if (form.lookupType === 'qrToken' && form.lookupValue.trim().length > 500) nextErrors.lookupValue = 'Dữ liệu QR tối đa 500 ký tự'
    if (form.lookupType === 'inviteCode' && !/^\d{6}$/.test(form.lookupValue.trim())) nextErrors.lookupValue = 'Mã mời phải gồm 6 chữ số'
    if (form.note.trim().length > 500) nextErrors.note = 'Ghi chú tối đa 500 ký tự'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)
    setResult(null)

    try {
      const payload = {
        qrToken: form.lookupType === 'qrToken' ? form.lookupValue.trim() : null,
        inviteCode: form.lookupType === 'inviteCode' ? form.lookupValue.trim() : null,
        note: form.note.trim() || null,
      }
      const data = await checkInApi.scan.sessionQrOrInvite(eventId, sessionId, payload)
      setResult(data)
      setForm(emptyScanForm)
      await loadRecords(1, recordPageSize)
      onSuccess(data?.message || 'Check-in thành công')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function goBackToSession() {
    navigate(`/organizations/${organizationId}/events/${eventId}/check-in/sessions/${sessionId}`)
  }

  function goToRecordPage(page) {
    setRecordPage(Math.min(Math.max(page, 1), recordTotalPages))
  }

  function handleRecordPageSizeChange(nextPageSize) {
    setRecordPageSize(nextPageSize)
    setRecordPage(1)
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Đang tải trang check-in...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title={session?.name ? `Check-in: ${session.name}` : 'Check-in phiên'}
        description="Quét QR trong email của khách hoặc nhập mã mời 6 chữ số để ghi nhận check-in."
        icon={<ScanLine size={24} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={goBackToSession}>
              Chi tiết phiên
            </Button>
            <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={loadWorkspace}>
              Tải lại
            </Button>
          </div>
        }
        stats={[
          { label: 'Records', value: recordTotal },
          { label: 'Trạng thái', value: session?.status || 'N/A' },
        ]}
      />

      {hasSubscriptionGateError ? <SubscriptionGateBanner error={subscriptionGateError} organizationId={organizationId} /> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(380px,0.85fr)_minmax(420px,1.15fr)]">
        <Card title="Nhập mã check-in">
          <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={sessionStatusVariants[session?.status] || 'default'}>
                {sessionStatusLabels[session?.status] || session?.status || 'N/A'}
              </Badge>
              {session?.status !== 'OPEN' ? <Badge variant="warning">Chưa nhận check-in</Badge> : null}
            </div>
          </div>

          {errors.session ? <p className="mb-3 text-sm font-medium text-danger">{errors.session}</p> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Cách check-in">
              <Select name="lookupType" value={form.lookupType} onChange={handleChange}>
                <option value="inviteCode">Nhập mã mời</option>
                <option value="qrToken">Quét QR khách</option>
              </Select>
            </FormField>
            <FormField label={form.lookupType === 'qrToken' ? 'Dữ liệu QR' : 'Mã mời'} required error={errors.lookupValue}>
              <Input
                name="lookupValue"
                value={form.lookupValue}
                onChange={handleChange}
                error={errors.lookupValue}
                placeholder={form.lookupType === 'qrToken' ? 'Dán dữ liệu QR sau khi quét...' : 'Nhập mã mời 6 chữ số'}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Ghi chú" error={errors.note}>
              <Textarea name="note" value={form.note} onChange={handleChange} error={errors.note} placeholder="Ghi chú ngắn..." />
            </FormField>

            <Button type="submit" className="w-full" loading={isSubmitting} leftIcon={<CheckCircle2 size={16} />} disabled={hasSubscriptionGateError}>
              Hoàn thành check-in
            </Button>
          </form>

          {result ? (
            <div className={result.duplicate ? 'mt-4 rounded-xl border border-warning/30 bg-warning-bg p-4' : 'mt-4 rounded-xl border border-success/30 bg-success-bg p-4'}>
              <Badge variant={result.duplicate ? 'warning' : 'success'}>
                {result.duplicate ? 'Đã check-in trước đó' : 'Check-in thành công'}
              </Badge>
              <p className="mt-2 text-sm font-semibold text-neutral-900">{result.message}</p>
              {result.attendee ? (
                <p className="mt-1 text-sm text-neutral-700">
                  {result.attendee.fullName} - {result.attendee.inviteCode}
                </p>
              ) : null}
            </div>
          ) : null}
        </Card>

        <CheckInRecordsPanel
          session={session}
          records={records}
          isLoading={isRecordsLoading}
          error={recordsError}
          onRefresh={loadRecords}
          pagination={
            <PaginationControls
              currentPage={recordPage}
              totalPages={recordTotalPages}
              pageSize={recordPageSize}
              onPageChange={goToRecordPage}
              onPageSizeChange={handleRecordPageSizeChange}
            />
          }
        />
      </div>
    </div>
  )
}

function EventCheckInRunnerPage() {
  const { organizationId, eventId, sessionId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <EventCheckInRunnerContent
          organizationId={Number(organizationId)}
          eventId={Number(eventId)}
          sessionId={Number(sessionId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default EventCheckInRunnerPage
