import { useEffect, useState } from 'react'
import { ArrowLeft, Mail, Pencil, Trash2, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { organizationMemberApi } from '../api'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'
import { statusVariant } from '../features/organizations/organizationConstants'
import {
  getOrganizationInvitationRowPolicy,
  getOrganizationInvitePolicy,
  getOrganizationPermissions,
} from '../features/organizations/organizationPermissions'
import {
  organizationRoleDescriptions,
  organizationRoleLabels,
  privilegedOrganizationRoles,
} from '../features/organizations/organizationRoles'
import useAutoReload from '../hooks/useAutoReload'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'
import { normalizeOrganizationInvitation } from '../utils/organizationMappers'

function OrganizationMemberInvitationsContent({
  organizationId,
  onError,
  onSuccess,
  permissions = getOrganizationPermissions('MEMBER'),
}) {
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingInvitationId, setEditingInvitationId] = useState(null)
  const [invitationDraftRole, setInvitationDraftRole] = useState('MEMBER')
  const [updatingInvitationId, setUpdatingInvitationId] = useState(null)
  const [cancelingInvitationId, setCancelingInvitationId] = useState(null)
  const pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending')
  const invitePolicy = getOrganizationInvitePolicy(permissions)

  async function loadInvitations() {
    if (!invitePolicy.canViewInvitations) {
      setInvitations([])
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      const response = await organizationMemberApi.getInvitations(organizationId)
      setInvitations((response.data || []).map(normalizeOrganizationInvitation).filter((invitation) => invitation.status === 'pending'))
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  useAutoReload(loadInvitations)

  function handleEditInvitation(invitation) {
    const rowPolicy = getOrganizationInvitationRowPolicy(permissions, invitation)
    setEditingInvitationId(invitation.invitationId)
    setInvitationDraftRole(rowPolicy.editableRoles.includes(invitation.role) ? invitation.role : rowPolicy.editableRoles[0] || 'MEMBER')
    onError(null)
    onSuccess(null)
  }

  async function handleUpdateInvitation(invitation) {
    if (!invitation?.invitationId) return

    setUpdatingInvitationId(invitation.invitationId)
    onError(null)
    onSuccess(null)

    try {
      const response = await organizationMemberApi.updateInvitation(invitation.invitationId, {
        role: invitationDraftRole,
      })
      const updated = normalizeOrganizationInvitation(response.data)
      setInvitations((current) => current.map((item) => (item.invitationId === updated.invitationId ? updated : item)))
      setEditingInvitationId(null)
      onSuccess('Đã cập nhật vai trò lời mời')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setUpdatingInvitationId(null)
    }
  }

  async function handleCancelInvitation(invitation) {
    if (!invitation?.invitationId) return

    setCancelingInvitationId(invitation.invitationId)
    onError(null)
    onSuccess(null)

    try {
      await organizationMemberApi.cancelInvitation(invitation.invitationId)
      setInvitations((current) => current.filter((item) => item.invitationId !== invitation.invitationId))
      onSuccess('Đã hủy lời mời')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setCancelingInvitationId(null)
    }
  }

  if (!invitePolicy.canViewInvitations) return null

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Lời mời đang xử lý</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
              Đang có {pendingInvitations.length} đơn lời mời chưa xác nhận. Lời mời đã xác nhận thành công sẽ không hiển thị tại đây.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate(`/organizations/${organizationId}/members`)}
            >
              Quay lại thành viên
            </Button>
            {invitePolicy.canInviteMembers ? (
              <Button
                type="button"
                leftIcon={<Mail size={16} />}
                onClick={() => navigate(`/organizations/${organizationId}/members/invite`)}
              >
                Gửi lời mời
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <Card
        title="Danh sách lời mời"
        headerRight={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="warning">{pendingInvitations.length} đang xử lý</Badge>
          </div>
        }
      >
        {pendingInvitations.length === 0 ? (
          <EmptyState
            icon={<Mail size={24} />}
            title={isLoading ? 'Đang tải lời mời' : 'Không có đơn đang xử lý'}
            description="Lời mời đã được xác nhận thành công sẽ tự ẩn khỏi danh sách này."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pendingInvitations.map((invitation) => {
              const isEditing = editingInvitationId === invitation.invitationId
              const rowPolicy = getOrganizationInvitationRowPolicy(permissions, invitation)

              return (
                <article key={invitation.invitationId} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-neutral-900">{invitation.email}</p>
                      <p className="mt-1 text-xs text-neutral-500">Người mời: {invitation.invitedByUserName || 'Không rõ'}</p>
                      <p className="mt-1 text-xs text-neutral-500">Hết hạn: {formatDateTime(invitation.expiresAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant[invitation.status] || 'default'}>{invitation.status}</Badge>
                      {!isEditing ? (
                        <Badge variant={privilegedOrganizationRoles.has(invitation.role) ? 'warning' : 'info'}>
                          {organizationRoleLabels[invitation.role] || invitation.role}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {isEditing ? (
                      <Select className="sm:max-w-56" value={invitationDraftRole} onChange={(event) => setInvitationDraftRole(event.target.value)}>
                        {rowPolicy.editableRoles.map((role) => (
                          <option key={role} value={role}>
                            {organizationRoleLabels[role]} ({role})
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <p className="text-sm text-neutral-500">{organizationRoleDescriptions[invitation.role] || 'Vai trò nội bộ trong tổ chức.'}</p>
                    )}
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={updatingInvitationId === invitation.invitationId}
                          onClick={() => handleUpdateInvitation(invitation)}
                        >
                          Lưu
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<X size={16} />} onClick={() => setEditingInvitationId(null)}>
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      rowPolicy.canEdit || rowPolicy.canCancel ? (
                        <div className="flex justify-end gap-2">
                          {rowPolicy.canEdit ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Pencil size={16} />}
                              onClick={() => handleEditInvitation(invitation)}
                            >
                              Sửa
                            </Button>
                          ) : null}
                          {rowPolicy.canCancel ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 size={16} />}
                              loading={cancelingInvitationId === invitation.invitationId}
                              onClick={() => handleCancelInvitation(invitation)}
                            >
                              Hủy mời
                            </Button>
                          ) : null}
                        </div>
                      ) : null
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function OrganizationMemberInvitationsPage() {
  const { organizationId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {(_, context) => (
        <OrganizationMemberInvitationsContent
          organizationId={Number(organizationId)}
          onError={setError}
          onSuccess={setSuccessMessage}
          permissions={context.permissions}
        />
      )}
    </OrganizationCaseLayout>
  )
}

export default OrganizationMemberInvitationsPage
