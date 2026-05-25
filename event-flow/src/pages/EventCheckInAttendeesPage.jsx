import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Search, TicketCheck, Trash2, UserRoundCheck, X } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { checkInApi } from '../api'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PaginationControls from '../components/ui/PaginationControls'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { statusVariant } from '../features/organizations/organizationConstants'
import { getErrorMessage, getFieldErrors, isSubscriptionGateError } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const emptyAttendeeForm = {
  fullName: '',
  email: '',
  phone: '',
  inviteCode: '',
  status: 'INVITED',
  source: 'MANUAL',
}

const attendeeStatusOptions = ['INVITED', 'REGISTERED', 'CANCELLED', 'NO_SHOW']
const attendeeSourceOptions = ['MANUAL', 'IMPORT', 'LANDING_PAGE', 'API']
const DEFAULT_ATTENDEES_PER_PAGE = 10

const statusLabels = {
  INVITED: 'Đã mời',
  REGISTERED: 'Đã đăng ký',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Vắng mặt',
}

const sourceLabels = {
  MANUAL: 'Thêm thủ công',
  IMPORT: 'Import',
  LANDING_PAGE: 'Landing page',
  API: 'API',
}

function EventCheckInAttendeesContent({ eventDetail, organizationId, eventId, onError, onSuccess }) {
  const [attendees, setAttendees] = useState([])
  const [form, setForm] = useState(emptyAttendeeForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAttendee, setEditingAttendee] = useState(null)
  const [pendingDeleteAttendee, setPendingDeleteAttendee] = useState(null)
  const [deletingAttendeeId, setDeletingAttendeeId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_ATTENDEES_PER_PAGE)
  const [subscriptionGateError, setSubscriptionGateError] = useState(null)
  const hasSubscriptionGateError = isSubscriptionGateError(subscriptionGateError)

  async function loadAttendees() {
    setIsLoading(true)
    onError(null)
    setSubscriptionGateError(null)

    try {
      const data = await checkInApi.attendees.list(eventId)
      setAttendees((Array.isArray(data) ? data : []).map(normalizeAttendee))
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
    loadAttendees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const filteredAttendees = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return attendees

    return attendees.filter((attendee) =>
      [
        attendee.fullName,
        attendee.email,
        attendee.phone,
        attendee.inviteCode,
        attendee.status,
        attendee.source,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    )
  }, [attendees, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredAttendees.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pagedAttendees = filteredAttendees.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
  const registeredCount = attendees.filter((attendee) => attendee.status === 'REGISTERED').length
  const activeCount = attendees.filter((attendee) => !['CANCELLED', 'NO_SHOW'].includes(attendee.status)).length

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function validateForm() {
    const nextErrors = {}
    const email = form.email.trim()

    if (!form.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ tên người tham dự'
    if (form.fullName.trim().length > 255) nextErrors.fullName = 'Họ tên tối đa 255 ký tự'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email không hợp lệ'
    if (email.length > 255) nextErrors.email = 'Email tối đa 255 ký tự'
    if (form.phone.trim().length > 50) nextErrors.phone = 'Số điện thoại tối đa 50 ký tự'
    if (!form.inviteCode.trim()) nextErrors.inviteCode = 'Vui lòng nhập mã mời'
    if (form.inviteCode.trim().length > 100) nextErrors.inviteCode = 'Mã mời tối đa 100 ký tự'
    if (!attendeeStatusOptions.includes(form.status)) nextErrors.status = 'Trạng thái không hợp lệ'
    if (!attendeeSourceOptions.includes(form.source)) nextErrors.source = 'Nguồn không hợp lệ'

    const duplicatedInviteCode = attendees.some((attendee) => {
      const isSameAttendee = editingAttendee?.id && Number(attendee.id) === Number(editingAttendee.id)
      return !isSameAttendee && attendee.inviteCode?.toLowerCase() === form.inviteCode.trim().toLowerCase()
    })
    if (duplicatedInviteCode) nextErrors.inviteCode = 'Mã mời này đã tồn tại trong sự kiện'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildPayload() {
    return {
      fullName: form.fullName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      inviteCode: form.inviteCode.trim(),
      qrToken: editingAttendee?.qrToken || null,
      qrExpiresAt: editingAttendee?.qrExpiresAt || null,
      status: form.status,
      source: form.source,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      if (editingAttendee?.id) {
        await checkInApi.attendees.update(eventId, editingAttendee.id, buildPayload())
        onSuccess('Đã cập nhật người tham dự')
      } else {
        await checkInApi.attendees.create(eventId, buildPayload())
        onSuccess('Đã thêm người tham dự')
      }

      closeForm()
      await loadAttendees()
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
    setEditingAttendee(null)
    setForm(emptyAttendeeForm)
    setErrors({})
    setIsFormOpen(true)
  }

  function openEditForm(attendee) {
    setEditingAttendee(attendee)
    setForm({
      fullName: attendee.fullName || '',
      email: attendee.email || '',
      phone: attendee.phone || '',
      inviteCode: attendee.inviteCode || '',
      status: attendee.status || 'INVITED',
      source: attendee.source || 'MANUAL',
    })
    setErrors({})
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingAttendee(null)
    setForm(emptyAttendeeForm)
    setErrors({})
    setIsFormOpen(false)
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value)
    setCurrentPage(1)
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  async function handleConfirmDeleteAttendee() {
    if (!pendingDeleteAttendee?.id) return

    setDeletingAttendeeId(pendingDeleteAttendee.id)
    onError(null)
    onSuccess(null)

    try {
      await checkInApi.attendees.delete(eventId, pendingDeleteAttendee.id)
      setPendingDeleteAttendee(null)
      await loadAttendees()
      onSuccess('Đã xóa người tham dự khỏi danh sách check-in')
    } catch (err) {
      if (isSubscriptionGateError(err)) {
        setSubscriptionGateError(err)
      } else {
        onError(getErrorMessage(err))
      }
    } finally {
      setDeletingAttendeeId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Đang tải danh sách người tham dự...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Người tham dự check-in"
        description="Quản lý danh sách khách mời, mã mời và trạng thái đăng ký trước khi vận hành check-in."
        icon={<TicketCheck size={24} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={loadAttendees}>
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
              {isFormOpen ? 'Đóng biểu mẫu' : 'Thêm người tham dự'}
            </Button>
          </div>
        }
        stats={[
          { label: 'Tổng người tham dự', value: attendees.length },
          { label: 'Có thể check-in', value: activeCount },
          { label: 'Đã đăng ký', value: registeredCount },
          { label: 'Sức chứa sự kiện', value: eventDetail?.capacity || 'Không giới hạn' },
        ]}
      />

      {hasSubscriptionGateError ? <SubscriptionGateBanner error={subscriptionGateError} organizationId={organizationId} /> : null}

      <Card title="Danh sách người tham dự">
        {isFormOpen ? (
          <form className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={handleSubmit}>
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-info/20 bg-info-bg p-3 text-sm text-info">
              <UserRoundCheck size={18} className="mt-0.5 shrink-0" />
              <p>
                Mỗi người tham dự cần có mã mời riêng. Email và số điện thoại có thể để trống nếu backend cho phép, nhưng mã mời là bắt buộc cho check-in thủ công.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField label="Họ tên" required error={errors.fullName}>
                <Input name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} placeholder="Nguyễn Văn A" />
              </FormField>
              <FormField label="Mã mời" required error={errors.inviteCode}>
                <Input name="inviteCode" value={form.inviteCode} onChange={handleChange} error={errors.inviteCode} placeholder="VIP-001" />
              </FormField>
              <FormField label="Email" error={errors.email}>
                <Input name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="attendee@example.com" />
              </FormField>
              <FormField label="Số điện thoại" error={errors.phone}>
                <Input name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="090..." />
              </FormField>
              <FormField label="Trạng thái" required error={errors.status}>
                <Select name="status" value={form.status} onChange={handleChange} error={errors.status}>
                  {attendeeStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]} ({status})
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Nguồn" required error={errors.source}>
                <Select name="source" value={form.source} onChange={handleChange} error={errors.source}>
                  {attendeeSourceOptions.map((source) => (
                    <option key={source} value={source}>
                      {sourceLabels[source]} ({source})
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" loading={isSubmitting} leftIcon={editingAttendee ? <Pencil size={16} /> : <Plus size={16} />}>
                {editingAttendee ? 'Lưu thay đổi' : 'Thêm người tham dự'}
              </Button>
            </div>
          </form>
        ) : null}

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600">
              Hiển thị {pagedAttendees.length}/{filteredAttendees.length} người tham dự
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Search đang lọc local theo tên, email, điện thoại, mã mời, trạng thái và nguồn.
            </p>
          </div>
          <div className="w-full lg:w-80">
            <Input
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              leftIcon={<Search size={16} />}
              placeholder="Tìm người tham dự..."
            />
          </div>
        </div>

        {attendees.length === 0 ? (
          <EmptyState
            icon={<TicketCheck size={24} />}
            title="Chưa có người tham dự"
            description="Thêm người tham dự đầu tiên để chuẩn bị danh sách check-in cho sự kiện."
            action={
              <Button type="button" leftIcon={<Plus size={16} />} onClick={openCreateForm} disabled={hasSubscriptionGateError}>
                Thêm người tham dự
              </Button>
            }
          />
        ) : filteredAttendees.length === 0 ? (
          <EmptyState
            icon={<Search size={24} />}
            title="Không có kết quả phù hợp"
            description="Thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc để xem toàn bộ danh sách."
            action={
              <Button type="button" variant="secondary" onClick={() => setSearchTerm('')}>
                Xóa tìm kiếm
              </Button>
            }
          />
        ) : (
          <AttendeeTable
            attendees={pagedAttendees}
            deletingAttendeeId={deletingAttendeeId}
            onEdit={openEditForm}
            onDelete={setPendingDeleteAttendee}
          />
        )}

        <PaginationControls
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDeleteAttendee)}
        title="Xóa người tham dự?"
        description={`Xóa ${pendingDeleteAttendee?.fullName || 'người tham dự này'} khỏi danh sách check-in của sự kiện?`}
        loading={Boolean(deletingAttendeeId)}
        onClose={() => setPendingDeleteAttendee(null)}
        onConfirm={handleConfirmDeleteAttendee}
      />
    </div>
  )
}

function AttendeeTable({ attendees, deletingAttendeeId, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3">Người tham dự</th>
              <th scope="col" className="px-4 py-3">Liên hệ</th>
              <th scope="col" className="px-4 py-3">Mã mời</th>
              <th scope="col" className="px-4 py-3">Trạng thái</th>
              <th scope="col" className="px-4 py-3">QR</th>
              <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {attendees.map((attendee) => (
              <tr key={attendee.id} className="align-top transition hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-neutral-900">{attendee.fullName}</p>
                  <p className="mt-1 text-xs text-neutral-500">ID {attendee.id}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-neutral-700">{attendee.email || 'Chưa có email'}</p>
                  <p className="mt-1 text-xs text-neutral-500">{attendee.phone || 'Chưa có số điện thoại'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-mono text-xs font-semibold text-neutral-900">{attendee.inviteCode}</p>
                  <p className="mt-1 text-xs text-neutral-500">{sourceLabels[attendee.source] || attendee.source}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[attendee.status.toLowerCase()] || 'default'}>
                    {statusLabels[attendee.status] || attendee.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-neutral-500">Cấp: {formatDateTime(attendee.qrIssuedAt)}</p>
                  <p className="mt-1 text-xs text-neutral-500">Hết hạn: {formatDateTime(attendee.qrExpiresAt)}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" size="sm" leftIcon={<Pencil size={16} />} onClick={() => onEdit(attendee)}>
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 size={16} />}
                      loading={deletingAttendeeId === attendee.id}
                      onClick={() => onDelete(attendee)}
                    >
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function normalizeAttendee(attendee) {
  return {
    id: attendee.id,
    eventId: attendee.eventId,
    fullName: attendee.fullName || 'Người tham dự chưa có tên',
    email: attendee.email || '',
    phone: attendee.phone || '',
    inviteCode: attendee.inviteCode || '',
    qrToken: attendee.qrToken || '',
    qrIssuedAt: attendee.qrIssuedAt || null,
    qrExpiresAt: attendee.qrExpiresAt || null,
    status: attendee.status || 'INVITED',
    source: attendee.source || 'MANUAL',
    createAt: attendee.createAt || null,
    updateAt: attendee.updateAt || null,
  }
}

function EventCheckInAttendeesPage() {
  const { organizationId, eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ eventDetail }) => (
        <EventCheckInAttendeesContent
          eventDetail={eventDetail}
          organizationId={Number(organizationId)}
          eventId={Number(eventId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default EventCheckInAttendeesPage
