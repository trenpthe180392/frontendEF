import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, ShieldCheck, Trash2, UserCheck, UserPlus, Users, X } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { eventMemberApi, organizationMemberApi } from '../api'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import PaginationControls from '../components/ui/PaginationControls'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { eventRoleLabels, eventRoleOptions, normalizeEventMember } from '../features/events/eventPageUtils'
import { statusVariant } from '../features/organizations/organizationConstants'
import { getErrorMessage } from '../utils'
import { normalizeOrganizationMember } from '../utils/organizationMappers'

const emptyMemberForm = { userId: '', role: 'MEMBER' }
const DEFAULT_MEMBERS_PER_PAGE = 10
const privilegedRoles = new Set(['OWNER', 'LEADER'])
const roleDescriptions = {
  OWNER: 'Người chịu trách nhiệm cao nhất của sự kiện, quản lý cấu hình, thành viên và quyết định vận hành chính.',
  LEADER: 'Điều phối tổng thể kế hoạch, tiến độ và phối hợp giữa các đội nhóm trong sự kiện.',
  TEAM_LEADER: 'Đầu mối phụ trách một đội nhóm hoặc hạng mục, theo dõi nhân sự và bàn giao công việc của đội nhóm.',
  MEMBER: 'Thành viên ban tổ chức nội bộ, tham gia xử lý công việc và cập nhật tiến độ theo phân công.',
  HOST: 'Vai trò cũ, được hiển thị tương đương chủ sự kiện.',
  ORGANIZER: 'Vai trò cũ, được hiển thị tương đương trưởng sự kiện.',
  STAFF: 'Vai trò cũ, được hiển thị tương đương thành viên.',
  CHECKER: 'Vai trò cũ, được hiển thị tương đương thành viên.',
  ATTENDEE: 'Vai trò cũ, được hiển thị tương đương thành viên.',
  ORG_ADMIN: 'Vai trò cũ, được hiển thị tương đương chủ sự kiện.',
  FINANCE_MANAGER: 'Vai trò cũ, được hiển thị tương đương trưởng tài chính.',
  FINANCE_EXECUTOR: 'Vai trò cũ, được hiển thị tương đương trưởng đội tài chính.',
}

function normalizeMemberPage(responseData, pageSize = DEFAULT_MEMBERS_PER_PAGE) {
  if (Array.isArray(responseData)) {
    return {
      content: responseData,
      totalElements: responseData.length,
      totalPages: Math.max(1, Math.ceil(responseData.length / pageSize)),
      number: 0,
    }
  }
  return {
    content: responseData?.content || [],
    totalElements: responseData?.totalElements || 0,
    totalPages: Math.max(1, responseData?.totalPages || 1),
    number: responseData?.number || 0,
  }
}

function EventMembersContent({ organizationId, eventId, onError, onSuccess }) {
  const [members, setMembers] = useState([])
  const [organizationMembers, setOrganizationMembers] = useState([])
  const [memberForm, setMemberForm] = useState(emptyMemberForm)
  const [memberErrors, setMemberErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_MEMBERS_PER_PAGE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pendingRemoveMember, setPendingRemoveMember] = useState(null)
  const [removingUserId, setRemovingUserId] = useState(null)

  async function loadMembers() {
    setIsLoading(true)
    onError(null)

    try {
      const [membersResponse, organizationMembersResponse] = await Promise.all([
        eventMemberApi.getByEvent(eventId, { page: currentPage - 1, size: pageSize }),
        organizationMemberApi.getByOrganization(organizationId),
      ])

      const memberPage = normalizeMemberPage(membersResponse.data, pageSize)
      setMembers(memberPage.content.map(normalizeEventMember))
      setTotalElements(memberPage.totalElements)
      setTotalPages(memberPage.totalPages)
      setCurrentPage(memberPage.number + 1)
      setOrganizationMembers((organizationMembersResponse.data || []).map(normalizeOrganizationMember))
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, organizationId, currentPage, pageSize])

  const availableMembers = useMemo(() => {
    const existingUserIds = new Set(members.map((member) => Number(member.userId)))
    return organizationMembers.filter((member) => !existingUserIds.has(Number(member.userId)))
  }, [members, organizationMembers])

  const activeCount = members.filter((member) => member.status === 'active').length

  function handleChange(event) {
    const { name, value } = event.target
    setMemberForm((current) => ({
      ...current,
      [name]: value,
    }))
    setMemberErrors((current) => ({ ...current, [name]: null }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const selectedUserId = Number(memberForm.userId)
    const alreadyInEvent = members.some((member) => Number(member.userId) === selectedUserId)

    if (!memberForm.userId) nextErrors.userId = 'Vui lòng chọn thành viên'
    if (alreadyInEvent) nextErrors.userId = 'Thành viên này đã thuộc sự kiện'
    if (availableMembers.length === 0) nextErrors.userId = 'Không còn thành viên tổ chức khả dụng để thêm'
    if (!memberForm.role) nextErrors.role = 'Vui lòng chọn vai trò'
    if (!eventRoleOptions.includes(memberForm.role)) nextErrors.role = 'Vai trò không hợp lệ'
    setMemberErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      await eventMemberApi.add({
        eventId,
        userId: Number(memberForm.userId),
        role: memberForm.role,
      })
      setMemberForm(emptyMemberForm)
      setIsFormOpen(false)
      await loadMembers()
      onSuccess('Đã thêm thành viên vào sự kiện')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeForm() {
    setMemberForm(emptyMemberForm)
    setMemberErrors({})
    setIsFormOpen(false)
  }

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  async function handleConfirmRemoveMember() {
    if (!pendingRemoveMember?.userId) return

    setRemovingUserId(pendingRemoveMember.userId)
    onError(null)
    onSuccess(null)

    try {
      await eventMemberApi.remove(eventId, pendingRemoveMember.userId)
      setPendingRemoveMember(null)
      if (members.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        await loadMembers()
      }
      onSuccess('Đã xóa thành viên khỏi sự kiện')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setRemovingUserId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[260px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Thành viên sự kiện"
        description="Quản lý ban tổ chức nội bộ, phân quyền vận hành và thành viên phụ trách sự kiện."
        icon={<Users size={24} />}
        actions={
          <Button
            type="button"
            variant={isFormOpen ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={isFormOpen ? <X size={16} /> : <UserPlus size={16} />}
            onClick={isFormOpen ? closeForm : () => setIsFormOpen(true)}
          >
            {isFormOpen ? 'Đóng biểu mẫu' : 'Thêm thành viên'}
          </Button>
        }
        stats={[
          { label: 'Thành viên', value: totalElements },
          { label: 'Đang hoạt động', value: activeCount },
          { label: 'Trang', value: `${currentPage}/${totalPages}` },
        ]}
      />

      <div className="grid grid-cols-1 gap-4">
        <Card title="Danh sách thành viên">
      {isFormOpen ? (
        <form className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={handleSubmit}>
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-info/20 bg-info-bg p-3 text-sm text-info">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <p>Chỉ có thể thêm người đã là thành viên của tổ chức. Mỗi người dùng chỉ xuất hiện một lần trong sự kiện.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <FormField label="Thành viên tổ chức" required error={memberErrors.userId}>
              <Select name="userId" value={memberForm.userId} onChange={handleChange} error={memberErrors.userId}>
                <option value="">Chọn thành viên</option>
                {availableMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.userName} - Mã {member.userId}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Vai trò" required error={memberErrors.role}>
              <Select name="role" value={memberForm.role} onChange={handleChange} error={memberErrors.role}>
                {eventRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {eventRoleLabels[role]} ({role})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-start gap-3">
              <BadgeCheck size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{eventRoleLabels[memberForm.role]}</p>
                <p className="mt-0.5 text-xs font-medium text-neutral-500">{memberForm.role}</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">{roleDescriptions[memberForm.role] || 'Vai trò nội bộ trong sự kiện.'}</p>
                {privilegedRoles.has(memberForm.role) ? (
                  <p className="mt-2 text-xs font-semibold text-warning">
                    Vai trò quyền cao, chỉ gán cho người chịu trách nhiệm rõ ràng.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" loading={isSubmitting} leftIcon={<UserPlus size={16} />} disabled={availableMembers.length === 0}>
                Thêm thành viên
              </Button>
          </div>
        </form>
      ) : null}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-neutral-600">
          Hiển thị {members.length}/{totalElements} thành viên
        </p>
        <p className="text-xs text-neutral-500">{availableMembers.length} thành viên tổ chức còn có thể thêm</p>
      </div>

      {totalElements === 0 ? (
        <EmptyState icon={<Users size={24} />} title="Chưa có thành viên" description="Thêm thành viên từ tổ chức vào sự kiện này." />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {members.map((member) => (
            <article key={member.userEventId} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
                    <UserCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-900">{member.userName}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">Mã người dùng {member.userId}</p>
                  </div>
                </div>
                  <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={privilegedRoles.has(member.role) ? 'warning' : 'info'}>{eventRoleLabels[member.role] || member.role}</Badge>
                  <Badge variant={statusVariant[member.status] || 'default'}>{member.status}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={16} />}
                    loading={removingUserId === member.userId}
                    onClick={() => setPendingRemoveMember(member)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-sm leading-5 text-neutral-500">{roleDescriptions[member.role] || 'Vai trò nội bộ trong sự kiện.'}</p>
            </article>
          ))}
        </div>
      )}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={handlePageSizeChange}
      />
        </Card>

      </div>

      <ConfirmDialog
        open={Boolean(pendingRemoveMember)}
        title="Xóa thành viên khỏi sự kiện"
        description={`Xóa ${pendingRemoveMember?.userName || 'thành viên'} khỏi ban tổ chức của sự kiện này?`}
        loading={Boolean(removingUserId)}
        onClose={() => setPendingRemoveMember(null)}
        onConfirm={handleConfirmRemoveMember}
      />
    </div>
  )
}

function EventMembersPage() {
  const { organizationId, eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <EventMembersContent
          organizationId={Number(organizationId)}
          eventId={Number(eventId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default EventMembersPage
