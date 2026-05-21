import { useEffect, useState } from 'react'
import { Mail, Trash2, UserCheck, UserPlus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { organizationMemberApi } from '../../api'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PaginationControls from '../../components/ui/PaginationControls'
import { getErrorMessage } from '../../utils'
import { normalizeOrganizationInvitation, normalizeOrganizationMember } from '../../utils/organizationMappers'
import { statusVariant } from './organizationConstants'
import {
  organizationRoleDescriptions,
  organizationRoleLabels,
  privilegedOrganizationRoles,
} from './organizationRoles'
const DEFAULT_MEMBERS_PER_PAGE = 10

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

function OrganizationMembersSection({ organizationId, onError, onSuccess, onCountChange }) {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [removingUserId, setRemovingUserId] = useState(null)
  const [pendingRemoveMember, setPendingRemoveMember] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_MEMBERS_PER_PAGE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0)

  const activeMemberCount = members.filter((member) => member.status === 'active').length

  useEffect(() => {
    async function loadMembers() {
      try {
        const [membersResponse, invitationsResponse] = await Promise.all([
          organizationMemberApi.getByOrganization(organizationId, { page: currentPage - 1, size: pageSize }),
          organizationMemberApi.getInvitations(organizationId),
        ])
        const memberPage = normalizeMemberPage(membersResponse.data, pageSize)
        const normalizedMembers = memberPage.content.map(normalizeOrganizationMember)
        const pendingCount = (invitationsResponse.data || [])
          .map(normalizeOrganizationInvitation)
          .filter((invitation) => invitation.status === 'pending').length
        setMembers(normalizedMembers)
        setTotalElements(memberPage.totalElements)
        setTotalPages(memberPage.totalPages)
        setCurrentPage(memberPage.number + 1)
        setPendingInvitationCount(pendingCount)
        onCountChange?.(memberPage.totalElements)
      } catch (err) {
        onError(getErrorMessage(err))
      }
    }

    loadMembers()
  }, [organizationId, currentPage, pageSize, onCountChange, onError])

  async function handleConfirmRemoveMember() {
    if (!pendingRemoveMember?.userId) return

    setRemovingUserId(pendingRemoveMember.userId)
    onError(null)
    onSuccess(null)

    try {
      await organizationMemberApi.remove(organizationId, pendingRemoveMember.userId)
      setPendingRemoveMember(null)
      if (members.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        const membersResponse = await organizationMemberApi.getByOrganization(organizationId, { page: currentPage - 1, size: pageSize })
        const memberPage = normalizeMemberPage(membersResponse.data, pageSize)
        const normalizedMembers = memberPage.content.map(normalizeOrganizationMember)
        setMembers(normalizedMembers)
        setTotalElements(memberPage.totalElements)
        setTotalPages(memberPage.totalPages)
        setCurrentPage(memberPage.number + 1)
        onCountChange?.(memberPage.totalElements)
      }
      onSuccess('Đã xóa thành viên khỏi tổ chức')
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
              <h1 className="text-2xl font-bold text-neutral-900">Thành viên tổ chức</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
                Quản lý lời mời, phân quyền thành viên và kiểm soát truy cập cấp tổ chức.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Kpi label="Thành viên" value={totalElements} />
            <Kpi label="Đang hoạt động" value={activeMemberCount} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-4">
          <Card
            title="Thao tác thành viên"
            noPadding
            headerRight={
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Mail size={16} />}
                  className="relative"
                  onClick={() => navigate(`/organizations/${organizationId}/members/invitations`)}
                >
                  {pendingInvitationCount > 0 ? (
                    <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
                      {pendingInvitationCount}
                    </span>
                  ) : null}
                  Lời mời
                </Button>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<UserPlus size={16} />}
                  onClick={() => navigate(`/organizations/${organizationId}/members/invite`)}
                >
                  Gửi lời mời
                </Button>
              </div>
            }
          />

      <Card title="Thành viên tổ chức">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-neutral-600">
            Hiển thị {members.length}/{totalElements} thành viên
          </p>
          <p className="text-xs text-neutral-500">Trang {currentPage}/{totalPages}</p>
        </div>
        {members.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="Chưa có thành viên"
            description="Gửi lời mời bằng email. Thành viên chỉ xuất hiện sau khi xác nhận email."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {members.map((member) => (
              <article key={member.id} className="rounded-xl border border-neutral-200 bg-white p-4">
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
                    <Badge variant={privilegedOrganizationRoles.has(member.role) ? 'warning' : 'info'}>
                      {organizationRoleLabels[member.role] || member.role}
                    </Badge>
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
                <p className="mt-3 text-sm leading-5 text-neutral-500">{organizationRoleDescriptions[member.role] || 'Vai trò nội bộ trong tổ chức.'}</p>
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

      </div>

      <ConfirmDialog
        open={Boolean(pendingRemoveMember)}
        title="Xóa thành viên"
        description={`Xóa ${pendingRemoveMember?.userName || 'thành viên'} khỏi tổ chức này?`}
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

export default OrganizationMembersSection
