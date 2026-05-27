import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Inbox, Mail, UserPlus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { organizationMemberApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'
import { defaultMemberForm } from '../features/organizations/organizationConstants'
import { getOrganizationInvitePolicy, getOrganizationPermissions } from '../features/organizations/organizationPermissions'
import { organizationRoleLabels } from '../features/organizations/organizationRoles'
import { getErrorMessage } from '../utils'
import { normalizeOrganizationInvitation } from '../utils/organizationMappers'

function OrganizationMemberInviteContent({
  organizationId,
  onError,
  onSuccess,
  permissions = getOrganizationPermissions('MEMBER'),
}) {
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultMemberForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const invitePolicy = useMemo(() => getOrganizationInvitePolicy(permissions), [permissions])

  async function loadPendingInvitations() {
    try {
      const response = await organizationMemberApi.getInvitations(organizationId)
      const count = (response.data || [])
        .map(normalizeOrganizationInvitation)
        .filter((invitation) => invitation.status === 'pending').length
      setPendingCount(count)
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadPendingInvitations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  useEffect(() => {
    if (!invitePolicy.canInviteMembers) {
      navigate(`/organizations/${organizationId}/members`, { replace: true })
      return
    }

    if (invitePolicy.assignableRoles.length > 0 && !invitePolicy.assignableRoles.includes(form.role)) {
      setForm((current) => ({ ...current, role: invitePolicy.assignableRoles[0] }))
    }
  }, [form.role, invitePolicy.assignableRoles, invitePolicy.canInviteMembers, navigate, organizationId])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
    onSuccess(null)
  }

  function validateForm() {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email'
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Email không hợp lệ'
    }

    if (!form.role) nextErrors.role = 'Vui lòng chọn vai trò'
    if (!invitePolicy.assignableRoles.includes(form.role)) nextErrors.role = 'Vai trò không hợp lệ'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await organizationMemberApi.add({
        email: form.email.trim(),
        organizationId,
        role: form.role,
      })
      setForm(defaultMemberForm)
      await loadPendingInvitations()
      onSuccess(response.data?.message || 'Đã gửi lời mời tham gia tổ chức')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!invitePolicy.canInviteMembers) return null

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Gửi lời mời thành viên</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
              Nhập email tài khoản đã đăng ký và chọn vai trò trong tổ chức cho thành viên mới.
            </p>
          </div>
          {invitePolicy.canViewInvitations ? (
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Inbox size={16} />}
              onClick={() => navigate(`/organizations/${organizationId}/members/invitations`)}
            >
              <span className="inline-flex items-center gap-2">
                Lời mời đang xử lý
                {pendingCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white">
                    {pendingCount}
                  </span>
                ) : null}
              </span>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(`/organizations/${organizationId}/members`)}
          >
            Quay lại thành viên
          </Button>
        </div>
      </section>

      <Card title="Thông tin lời mời">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <FormField label="Email thành viên" required error={errors.email}>
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="thanhvien@example.com"
                type="email"
                leftIcon={<Mail size={16} />}
              />
            </FormField>
            <FormField label="Vai trò sau khi xác nhận" required error={errors.role}>
              <Select name="role" value={form.role} onChange={handleChange}>
                {invitePolicy.assignableRoles.map((role) => (
                  <option key={role} value={role}>
                    {organizationRoleLabels[role]} ({role})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(`/organizations/${organizationId}/members`)}>
              Hủy
            </Button>
            <Button type="submit" loading={isSubmitting} leftIcon={<UserPlus size={16} />}>
              Gửi lời mời
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function OrganizationMemberInvitePage() {
  const { organizationId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {(_, context) => (
        <OrganizationMemberInviteContent
          organizationId={Number(organizationId)}
          onError={setError}
          onSuccess={setSuccessMessage}
          permissions={context.permissions}
        />
      )}
    </OrganizationCaseLayout>
  )
}

export default OrganizationMemberInvitePage
