import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Pencil, ShieldCheck, Trash2, UserCheck, UserPlus, Users, X } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { eventMemberApi, teamMemberApi } from '../api'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import PaginationControls from '../components/ui/PaginationControls'
import Select from '../components/ui/Select'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { normalizeTeamMember, teamMemberRoleLabels, teamMemberRoleOptions } from '../features/teams/teamPageUtils'
import { normalizeEventMember } from '../features/events/eventPageUtils'
import { statusVariant } from '../features/organizations/organizationConstants'
import { getErrorMessage } from '../utils'

const emptyForm = { userId: '', role: 'MEMBER', status: 'ACTIVE' }
const DEFAULT_MEMBERS_PER_PAGE = 10
const privilegedRoles = new Set(['TEAM_LEADER', 'SUB_TEAM_LEADER', 'OWNER', 'ADMIN', 'MANAGER'])
const roleDescriptions = {
  TEAM_LEADER: 'Người chịu trách nhiệm chính của đội nhóm, điều phối nhân sự, tiến độ và bàn giao với trưởng sự kiện.',
  SUB_TEAM_LEADER: 'Người hỗ trợ trưởng đội quản lý nhóm nhỏ, ca làm hoặc hạng mục cụ thể trong đội nhóm.',
  MEMBER: 'Thành viên của đội nhóm, xử lý công việc và cập nhật tiến độ theo phân công.',
  OWNER: 'Vai trò cũ, được hiển thị tương đương trưởng đội.',
  ADMIN: 'Vai trò cũ, được hiển thị tương đương phó đội.',
  MANAGER: 'Vai trò cũ, được hiển thị tương đương phó đội.',
}
const statusOptions = ['ACTIVE', 'INACTIVE', 'PENDING', 'BANNED']

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

function TeamMembersContent({ eventId, teamId, onError, onSuccess }) {
  const [members, setMembers] = useState([])
  const [eventMembers, setEventMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_MEMBERS_PER_PAGE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [editingMemberId, setEditingMemberId] = useState(null)
  const [roleDraft, setRoleDraft] = useState('MEMBER')
  const [statusDraft, setStatusDraft] = useState('ACTIVE')
  const [updatingMemberId, setUpdatingMemberId] = useState(null)
  const [removingUserId, setRemovingUserId] = useState(null)
  const [pendingRemoveMember, setPendingRemoveMember] = useState(null)

  async function loadMembers() {
    onError(null)
    try {
      const [teamMembersResponse, eventMembersResponse] = await Promise.all([
        teamMemberApi.getByTeam(teamId, { page: currentPage - 1, size: pageSize }),
        eventMemberApi.getByEvent(eventId),
      ])
      const memberPage = normalizeMemberPage(teamMembersResponse.data, pageSize)
      setMembers(memberPage.content.map(normalizeTeamMember))
      setTotalElements(memberPage.totalElements)
      setTotalPages(memberPage.totalPages)
      setCurrentPage(memberPage.number + 1)
      setEventMembers((eventMembersResponse.data || []).map(normalizeEventMember))
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, teamId, currentPage, pageSize])

  const availableMembers = useMemo(() => {
    const teamUserIds = new Set(members.map((member) => Number(member.userId)))
    return eventMembers.filter((member) => !teamUserIds.has(Number(member.userId)))
  }, [eventMembers, members])

  const activeCount = members.filter((member) => member.status === 'active').length

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const selectedUserId = Number(form.userId)
    if (!form.userId) nextErrors.userId = 'Vui lòng chọn thành viên'
    if (members.some((member) => Number(member.userId) === selectedUserId)) nextErrors.userId = 'Thành viên này đã thuộc đội nhóm'
    if (availableMembers.length === 0) nextErrors.userId = 'Không còn thành viên sự kiện khả dụng để thêm'
    if (!teamMemberRoleOptions.includes(form.role)) nextErrors.role = 'Vai trò không hợp lệ'
    if (!statusOptions.includes(form.status)) nextErrors.status = 'Trạng thái không hợp lệ'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)
    try {
      await teamMemberApi.add({ userId: Number(form.userId), teamId, role: form.role, status: form.status })
      setForm(emptyForm)
      setIsFormOpen(false)
      await loadMembers()
      onSuccess('Đã thêm thành viên vào đội nhóm')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeForm() {
    setForm(emptyForm)
    setErrors({})
    setIsFormOpen(false)
  }

  function startEdit(member) {
    setEditingMemberId(member.userTeamId)
    setRoleDraft(member.role)
    setStatusDraft(member.status.toUpperCase())
    onError(null)
    onSuccess(null)
  }

  async function handleUpdateMember(member) {
    if (!member?.userId) return

    setUpdatingMemberId(member.userTeamId)
    onError(null)
    onSuccess(null)

    try {
      await teamMemberApi.updateRole(teamId, member.userId, {
        role: roleDraft,
        status: statusDraft,
      })
      setEditingMemberId(null)
      await loadMembers()
      onSuccess('Đã cập nhật vai trò thành viên')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setUpdatingMemberId(null)
    }
  }

  async function handleConfirmRemoveMember() {
    if (!pendingRemoveMember?.userId) return

    setRemovingUserId(pendingRemoveMember.userId)
    onError(null)
    onSuccess(null)

    try {
      await teamMemberApi.remove(teamId, pendingRemoveMember.userId)
      setPendingRemoveMember(null)
      if (members.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        await loadMembers()
      }
      onSuccess('Đã xóa thành viên khỏi đội nhóm')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setRemovingUserId(null)
    }
  }

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <Users size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-neutral-900">Thành viên đội nhóm</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
                Quản lý thành viên được lấy từ sự kiện, phân quyền trong đội nhóm và kiểm soát trạng thái tham gia.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Kpi label="Thành viên" value={totalElements} />
            <Kpi label="Đang hoạt động" value={activeCount} />
            <Kpi label="Khả dụng" value={availableMembers.length} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <Card
          title="Danh sách thành viên đội nhóm"
          headerRight={
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
        >
      {isFormOpen ? (
        <form className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={handleSubmit}>
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-info/20 bg-info-bg p-3 text-sm text-info">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <p>Chỉ thêm người đã là thành viên của sự kiện. Mỗi người dùng chỉ xuất hiện một lần trong đội nhóm.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_160px]">
            <FormField label="Thành viên sự kiện" required error={errors.userId}>
              <Select name="userId" value={form.userId} onChange={handleChange} error={errors.userId}>
                <option value="">Chọn thành viên sự kiện</option>
                {availableMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.userName} - Mã {member.userId}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Vai trò" error={errors.role}>
              <Select name="role" value={form.role} onChange={handleChange} error={errors.role}>
                {teamMemberRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {teamMemberRoleLabels[role]} ({role})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Trạng thái" error={errors.status}>
              <Select name="status" value={form.status} onChange={handleChange} error={errors.status}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-start gap-3">
              <BadgeCheck size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{teamMemberRoleLabels[form.role]}</p>
                <p className="mt-0.5 text-xs font-medium text-neutral-500">{form.role}</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">{roleDescriptions[form.role] || 'Vai trò nội bộ trong đội nhóm.'}</p>
                {privilegedRoles.has(form.role) ? (
                  <p className="mt-2 text-xs font-semibold text-warning">Vai trò quyền cao trong đội nhóm, chỉ gán cho người điều phối đáng tin cậy.</p>
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
        <p className="text-xs text-neutral-500">{availableMembers.length} thành viên sự kiện còn có thể thêm</p>
      </div>

      {totalElements === 0 ? (
        <EmptyState icon={<Users size={24} />} title="Chưa có thành viên" description="Thành viên của đội nhóm sẽ hiển thị tại đây." />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {members.map((member) => {
            const isEditing = editingMemberId === member.userTeamId

            return (
              <article key={member.userTeamId} className="rounded-xl border border-neutral-200 bg-white p-4">
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
                    {!isEditing ? (
                      <>
                        <Badge variant={privilegedRoles.has(member.role) ? 'warning' : 'info'}>
                          {teamMemberRoleLabels[member.role] || member.role}
                        </Badge>
                        <Badge variant={statusVariant[member.status] || 'default'}>{member.status}</Badge>
                      </>
                    ) : null}
                    <Button variant="ghost" size="sm" leftIcon={<Pencil size={16} />} onClick={() => startEdit(member)}>
                      Sửa
                    </Button>
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
                {isEditing ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[160px_160px_auto_auto]">
                    <Select value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)}>
                      {teamMemberRoleOptions.map((role) => (
                        <option key={role} value={role}>
                          {teamMemberRoleLabels[role]} ({role})
                        </option>
                      ))}
                    </Select>
                    <Select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                    <Button size="sm" loading={updatingMemberId === member.userTeamId} onClick={() => handleUpdateMember(member)}>
                      Lưu
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingMemberId(null)}>
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-5 text-neutral-500">{roleDescriptions[member.role] || 'Vai trò nội bộ trong đội nhóm.'}</p>
                )}
              </article>
            )
          })}
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
        title="Xóa thành viên khỏi đội nhóm"
        description={`Xóa ${pendingRemoveMember?.userName || 'thành viên'} khỏi đội nhóm này?`}
        loading={Boolean(removingUserId)}
        onClose={() => setPendingRemoveMember(null)}
        onConfirm={handleConfirmRemoveMember}
      />
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-xl bg-neutral-50 px-4 py-3">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
    </div>
  )
}

function TeamMembersPage() {
  const { eventId, teamId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => <TeamMembersContent eventId={Number(eventId)} teamId={Number(teamId)} onError={setError} onSuccess={setSuccessMessage} />}
    </TeamCaseLayout>
  )
}

export default TeamMembersPage
