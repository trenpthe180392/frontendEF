import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, ScanLine, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { checkInApi } from '../api'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import PaginationControls from '../components/ui/PaginationControls'
import Spinner from '../components/ui/Spinner'
import CheckInSessionList from '../features/checkin/CheckInSessionList'
import { emptySessionForm, sessionStatusOptions } from '../features/checkin/checkInConstants'
import { normalizeSession } from '../features/checkin/checkInMappers'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { normalizePageResponse } from '../api/response'
import { toApiDateTime, toDateTimeLocalValue } from '../features/events/eventPageUtils'
import { getErrorMessage, getFieldErrors, isSubscriptionGateError } from '../utils'

const DEFAULT_SESSIONS_PER_PAGE = 10

function EventCheckInSessionsContent({ organizationId, eventId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_SESSIONS_PER_PAGE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSessions, setTotalSessions] = useState(0)
  const [sessionForm, setSessionForm] = useState(emptySessionForm)
  const [sessionErrors, setSessionErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSessionSubmitting, setIsSessionSubmitting] = useState(false)
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [pendingDeleteSession, setPendingDeleteSession] = useState(null)
  const [deletingSessionId, setDeletingSessionId] = useState(null)
  const [subscriptionGateError, setSubscriptionGateError] = useState(null)
  const hasSubscriptionGateError = isSubscriptionGateError(subscriptionGateError)

  async function loadSessions(nextPage = currentPage, nextSize = pageSize) {
    setIsLoading(true)
    onError(null)
    setSubscriptionGateError(null)

    try {
      const sessionsData = await checkInApi.sessions.list(eventId, { page: nextPage - 1, size: nextSize })
      const sessionPage = normalizePageResponse(sessionsData, nextSize)
      setSessions(sessionPage.items.map(normalizeSession))
      setTotalSessions(sessionPage.total)
      setTotalPages(Math.max(1, sessionPage.pages || 1))
      setCurrentPage((sessionPage.currentPage ?? 0) + 1)
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
  }, [eventId, currentPage, pageSize])

  const openCount = useMemo(() => sessions.filter((session) => session.status === 'OPEN').length, [sessions])
  const scheduledCount = useMemo(() => sessions.filter((session) => session.status === 'SCHEDULED').length, [sessions])

  function handleSessionFormChange(event) {
    const { name, value } = event.target
    setSessionForm((current) => ({ ...current, [name]: value }))
    setSessionErrors((current) => ({ ...current, [name]: null }))
  }

  function validateSessionForm() {
    const nextErrors = {}
    if (!sessionForm.name.trim()) nextErrors.name = 'Vui lòng nhập tên phiên check-in'
    if (sessionForm.name.trim().length > 255) nextErrors.name = 'Tên phiên tối đa 255 ký tự'
    if (sessionForm.location.trim().length > 255) nextErrors.location = 'Địa điểm tối đa 255 ký tự'
    if (!sessionStatusOptions.includes(sessionForm.status)) nextErrors.status = 'Trạng thái không hợp lệ'
    if (sessionForm.startTime && sessionForm.endTime && new Date(sessionForm.endTime) <= new Date(sessionForm.startTime)) {
      nextErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu'
    }
    setSessionErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildSessionPayload() {
    return {
      name: sessionForm.name.trim(),
      description: sessionForm.description.trim() || null,
      startTime: toApiDateTime(sessionForm.startTime),
      endTime: toApiDateTime(sessionForm.endTime),
      location: sessionForm.location.trim() || null,
      status: sessionForm.status,
    }
  }

  async function handleSessionSubmit(event) {
    event.preventDefault()
    if (!validateSessionForm()) return

    setIsSessionSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      let savedSession
      if (editingSession?.id) {
        savedSession = await checkInApi.sessions.update(eventId, editingSession.id, buildSessionPayload())
        onSuccess('Đã cập nhật phiên check-in')
      } else {
        savedSession = await checkInApi.sessions.create(eventId, buildSessionPayload())
        onSuccess('Đã tạo phiên check-in')
      }
      closeSessionForm()
      await loadSessions()
      if (!editingSession?.id && savedSession?.id) {
        handleViewSession(normalizeSession(savedSession))
      }
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setSessionErrors(fieldErrors)
      if (isSubscriptionGateError(err)) setSubscriptionGateError(err)
      else onError(getErrorMessage(err))
    } finally {
      setIsSessionSubmitting(false)
    }
  }

  function openCreateSessionForm() {
    setEditingSession(null)
    setSessionForm(emptySessionForm)
    setSessionErrors({})
    setIsSessionFormOpen(true)
  }

  function openEditSessionForm(session) {
    setEditingSession(session)
    setSessionForm({
      name: session.name || '',
      description: session.description || '',
      startTime: toDateTimeLocalValue(session.startTime),
      endTime: toDateTimeLocalValue(session.endTime),
      location: session.location || '',
      status: session.status || 'SCHEDULED',
    })
    setSessionErrors({})
    setIsSessionFormOpen(true)
  }

  function closeSessionForm() {
    setEditingSession(null)
    setSessionForm(emptySessionForm)
    setSessionErrors({})
    setIsSessionFormOpen(false)
  }

  function handleViewSession(session) {
    navigate(`/organizations/${organizationId}/events/${eventId}/check-in/sessions/${session.id}`)
  }

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  async function handleConfirmDeleteSession() {
    if (!pendingDeleteSession?.id) return

    setDeletingSessionId(pendingDeleteSession.id)
    onError(null)
    onSuccess(null)

    try {
      await checkInApi.sessions.delete(eventId, pendingDeleteSession.id)
      setPendingDeleteSession(null)
      await loadSessions()
      onSuccess('Đã xóa phiên check-in')
    } catch (err) {
      if (isSubscriptionGateError(err)) setSubscriptionGateError(err)
      else onError(getErrorMessage(err))
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
        title="Check-in"
        description="Quản lý các phiên check-in. Vào từng phiên để thêm người tham dự và ghi nhận check-in."
        icon={<ScanLine size={24} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={loadSessions}>
              Tải lại
            </Button>
            <Button
              type="button"
              variant={isSessionFormOpen ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={isSessionFormOpen ? <X size={16} /> : <Plus size={16} />}
              onClick={isSessionFormOpen ? closeSessionForm : openCreateSessionForm}
              disabled={hasSubscriptionGateError}
            >
              {isSessionFormOpen ? 'Đóng biểu mẫu' : 'Tạo phiên'}
            </Button>
          </div>
        }
        stats={[
          { label: 'Tổng phiên', value: totalSessions },
          { label: 'Đang mở trang này', value: openCount },
          { label: 'Lên lịch trang này', value: scheduledCount },
        ]}
      />

      {hasSubscriptionGateError ? <SubscriptionGateBanner error={subscriptionGateError} organizationId={organizationId} /> : null}

      <CheckInSessionList
        sessions={sessions}
        selectedSession={null}
        form={sessionForm}
        errors={sessionErrors}
        editingSession={editingSession}
        isSubmitting={isSessionSubmitting}
        isFormOpen={isSessionFormOpen}
        hasSubscriptionGateError={hasSubscriptionGateError}
        deletingSessionId={deletingSessionId}
        onChange={handleSessionFormChange}
        onCancelForm={closeSessionForm}
        onSubmit={handleSessionSubmit}
        onCreateForm={openCreateSessionForm}
        onEdit={openEditSessionForm}
        onDelete={setPendingDeleteSession}
        onSelect={handleViewSession}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={handlePageSizeChange}
      />

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
