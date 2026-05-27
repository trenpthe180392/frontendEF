import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RefreshCw, ScanLine } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { checkInApi } from '../api'
import { normalizePageResponse } from '../api/response'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import PaginationControls from '../components/ui/PaginationControls'
import Spinner from '../components/ui/Spinner'
import CheckInWorkspacePanel from '../features/checkin/CheckInWorkspacePanel'
import { emptyAttendeeForm } from '../features/checkin/checkInConstants'
import { normalizeAttendee, normalizeSession } from '../features/checkin/checkInMappers'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { getErrorMessage, getFieldErrors, isSubscriptionGateError } from '../utils'

const DEFAULT_ATTENDEES_PER_PAGE = 10

function EventCheckInSessionDetailContent({ organizationId, eventId, sessionId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [attendeePage, setAttendeePage] = useState(1)
  const [attendeePageSize, setAttendeePageSize] = useState(DEFAULT_ATTENDEES_PER_PAGE)
  const [attendeeTotalPages, setAttendeeTotalPages] = useState(1)
  const [attendeeTotal, setAttendeeTotal] = useState(0)
  const [attendeeForm, setAttendeeForm] = useState(emptyAttendeeForm)
  const [attendeeErrors, setAttendeeErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isAttendeeSubmitting, setIsAttendeeSubmitting] = useState(false)
  const [inviteActionId, setInviteActionId] = useState(null)
  const [generatedAttendee, setGeneratedAttendee] = useState(null)
  const [subscriptionGateError, setSubscriptionGateError] = useState(null)
  const hasSubscriptionGateError = isSubscriptionGateError(subscriptionGateError)

  async function loadAttendees(nextPage = attendeePage, nextSize = attendeePageSize) {
    const attendeesData = await checkInApi.attendees.list(eventId, { page: nextPage - 1, size: nextSize })
    const page = normalizePageResponse(attendeesData, nextSize)
    setAttendees(page.items.map(normalizeAttendee))
    setAttendeeTotal(page.total)
    setAttendeeTotalPages(Math.max(1, page.pages || 1))
    setAttendeePage((page.currentPage ?? 0) + 1)
  }

  async function loadSessionDetail() {
    setIsLoading(true)
    onError(null)
    setSubscriptionGateError(null)

    try {
      const sessionData = await checkInApi.sessions.get(eventId, sessionId)
      setSession(normalizeSession(sessionData))
      await loadAttendees()
    } catch (err) {
      if (isSubscriptionGateError(err)) setSubscriptionGateError(err)
      else onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessionDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, sessionId])

  useEffect(() => {
    if (!isLoading) {
      loadAttendees()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendeePage, attendeePageSize])

  const activeAttendeesOnPage = useMemo(() => attendees.filter((attendee) => !['CANCELLED', 'NO_SHOW'].includes(attendee.status)).length, [attendees])

  function handleAttendeeChange(event) {
    const { name, value } = event.target
    setAttendeeForm((current) => ({ ...current, [name]: value }))
    setAttendeeErrors((current) => ({ ...current, [name]: null }))
  }

  function validateAttendeeForm() {
    const nextErrors = {}
    if (!attendeeForm.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập tên người tham dự'
    if (attendeeForm.fullName.trim().length > 255) nextErrors.fullName = 'Tên tối đa 255 ký tự'
    if (attendeeForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeForm.email.trim())) {
      nextErrors.email = 'Email không hợp lệ'
    }
    if (attendeeForm.phone.trim().length > 50) nextErrors.phone = 'Số điện thoại tối đa 50 ký tự'
    if (attendeeForm.jobTitle.trim().length > 150) nextErrors.jobTitle = 'Chức danh tối đa 150 ký tự'
    if (attendeeForm.companyName.trim().length > 255) nextErrors.companyName = 'Công ty/đơn vị tối đa 255 ký tự'
    if (attendeeForm.departmentName.trim().length > 150) nextErrors.departmentName = 'Phòng ban tối đa 150 ký tự'
    if (attendeeForm.guestType.trim().length > 100) nextErrors.guestType = 'Nhóm khách tối đa 100 ký tự'
    if (attendeeForm.note.trim().length > 1000) nextErrors.note = 'Ghi chú tối đa 1000 ký tự'
    setAttendeeErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleCreateAttendee(event) {
    event.preventDefault()
    if (!validateAttendeeForm()) return

    setIsAttendeeSubmitting(true)
    onError(null)
    onSuccess(null)
    setGeneratedAttendee(null)

    try {
      const attendee = await checkInApi.sessions.addAttendee(eventId, sessionId, {
        fullName: attendeeForm.fullName.trim(),
        email: attendeeForm.email.trim() || null,
        phone: attendeeForm.phone.trim() || null,
        jobTitle: attendeeForm.jobTitle.trim() || null,
        companyName: attendeeForm.companyName.trim() || null,
        departmentName: attendeeForm.departmentName.trim() || null,
        guestType: attendeeForm.guestType.trim() || null,
        note: attendeeForm.note.trim() || null,
        inviteCode: null,
        qrToken: null,
        qrExpiresAt: null,
        status: 'REGISTERED',
        source: 'MANUAL',
      })
      const normalized = normalizeAttendee(attendee)
      setGeneratedAttendee(normalized)
      setAttendeeForm(emptyAttendeeForm)
      await loadAttendees(1, attendeePageSize)
      onSuccess(`Đã thêm ${normalized.fullName}. Mã mời: ${normalized.inviteCode}`)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setAttendeeErrors(fieldErrors)
      if (isSubscriptionGateError(err)) setSubscriptionGateError(err)
      else onError(getErrorMessage(err))
    } finally {
      setIsAttendeeSubmitting(false)
    }
  }

  async function handleResendInvite(attendee) {
    setInviteActionId(attendee.id)
    onError(null)
    onSuccess(null)
    setGeneratedAttendee(null)

    try {
      const updatedAttendee = await checkInApi.sessions.resendInviteEmail(eventId, sessionId, attendee.id)
      const normalized = normalizeAttendee(updatedAttendee)
      setGeneratedAttendee(normalized)
      await loadAttendees(attendeePage, attendeePageSize)
      onSuccess(`Đã gửi email QR cho ${normalized.fullName}. Mã mời: ${normalized.inviteCode}`)
    } catch (err) {
      if (isSubscriptionGateError(err)) setSubscriptionGateError(err)
      else onError(getErrorMessage(err))
    } finally {
      setInviteActionId(null)
    }
  }

  function goBackToSessions() {
    navigate(`/organizations/${organizationId}/events/${eventId}/check-in`)
  }

  function goToCheckInPage() {
    navigate(`/organizations/${organizationId}/events/${eventId}/check-in/sessions/${sessionId}/check-in`)
  }

  function goToAttendeePage(page) {
    setAttendeePage(Math.min(Math.max(page, 1), attendeeTotalPages))
  }

  function handleAttendeePageSizeChange(nextPageSize) {
    setAttendeePageSize(nextPageSize)
    setAttendeePage(1)
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Đang tải chi tiết phiên check-in...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title={session?.name ? `Phiên: ${session.name}` : 'Chi tiết phiên check-in'}
        description="Thêm người tham dự và xem danh sách theo phiên. Thao tác check-in nằm ở trang check-in riêng."
        icon={<ScanLine size={24} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={goBackToSessions}>
              Danh sách phiên
            </Button>
            <Button type="button" variant="primary" size="sm" leftIcon={<ScanLine size={16} />} onClick={goToCheckInPage}>
              Check-in
            </Button>
            <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={loadSessionDetail}>
              Tải lại
            </Button>
          </div>
        }
        stats={[
          { label: 'Người tham dự', value: attendeeTotal },
          { label: 'Có thể check-in trang này', value: activeAttendeesOnPage },
          { label: 'Trạng thái', value: session?.status || 'N/A' },
        ]}
      />

      {hasSubscriptionGateError ? <SubscriptionGateBanner error={subscriptionGateError} organizationId={organizationId} /> : null}

      <CheckInWorkspacePanel
        session={session}
        attendees={attendees}
        attendeeForm={attendeeForm}
        attendeeErrors={attendeeErrors}
        generatedAttendee={generatedAttendee}
        isAttendeeSubmitting={isAttendeeSubmitting}
        inviteActionId={inviteActionId}
        onAttendeeChange={handleAttendeeChange}
        onAttendeeSubmit={handleCreateAttendee}
        onResendInvite={handleResendInvite}
        pagination={
          <PaginationControls
            currentPage={attendeePage}
            totalPages={attendeeTotalPages}
            pageSize={attendeePageSize}
            onPageChange={goToAttendeePage}
            onPageSizeChange={handleAttendeePageSizeChange}
          />
        }
      />
    </div>
  )
}

function EventCheckInSessionDetailPage() {
  const { organizationId, eventId, sessionId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <EventCheckInSessionDetailContent
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

export default EventCheckInSessionDetailPage
