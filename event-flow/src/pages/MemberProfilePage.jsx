import { useEffect, useState } from 'react'
import { ArrowLeft, BadgeCheck, Mail, ShieldCheck, UserCircle } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { eventMemberApi, organizationMemberApi, teamMemberApi } from '../api'
import Card from '../components/layout/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EventCaseLayout from '../features/events/EventCaseLayout'
import { eventRoleLabels, normalizeEventMember } from '../features/events/eventPageUtils'
import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'
import { statusVariant } from '../features/organizations/organizationConstants'
import { organizationRoleLabels } from '../features/organizations/organizationRoles'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { normalizeTeamMember, teamMemberRoleLabels } from '../features/teams/teamPageUtils'
import { getErrorMessage } from '../utils'
import { normalizeOrganizationMember } from '../utils/organizationMappers'

function MemberProfileContent({ scope, organizationId, eventId, teamId, userId, initialMember, backPath, onError }) {
  const navigate = useNavigate()
  const [member, setMember] = useState(initialMember || null)
  const [isLoading, setIsLoading] = useState(!initialMember)

  useEffect(() => {
    if (initialMember) {
      setMember(initialMember)
      setIsLoading(false)
      return
    }

    async function loadMember() {
      setIsLoading(true)
      onError(null)

      try {
        const members = await loadMembersByScope({ scope, organizationId, eventId, teamId })
        const found = members.find((item) => Number(item.userId) === Number(userId)) || null
        setMember(found)
        if (!found) onError('Không tìm thấy thông tin thành viên trong phạm vi này.')
      } catch (err) {
        onError(getErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadMember()
  }, [eventId, initialMember, onError, organizationId, scope, teamId, userId])

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
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <UserCircle size={32} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-neutral-500">Profile thành viên</p>
              <h1 className="mt-1 text-2xl font-bold text-neutral-900">{member?.userName || `Người dùng ${userId}`}</h1>
              <p className="mt-1 text-sm text-neutral-500">{getScopeLabel(scope)}</p>
            </div>
          </div>
          <Button type="button" variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(backPath)}>
            Quay lại danh sách
          </Button>
        </div>
      </section>

      {!member ? (
        <Card title="Không có dữ liệu">
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            Không tìm thấy thành viên này trong danh sách hiện tại.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <Card title="Thông tin cá nhân">
            <InfoItem icon={<UserCircle size={18} />} label="Tên thành viên" value={member.userName || `Người dùng ${member.userId}`} />
            <InfoItem icon={<Mail size={18} />} label="Mã người dùng" value={member.userId || 'Không rõ'} />
            <InfoItem icon={<ShieldCheck size={18} />} label="Vai trò" value={getRoleLabel(scope, member.role)} />
            <InfoItem icon={<BadgeCheck size={18} />} label="Trạng thái" value={member.status || 'active'} />
          </Card>

          <Card title="Phạm vi truy cập">
            <div className="space-y-3">
              <Badge variant={statusVariant[member.status] || 'default'}>{member.status || 'active'}</Badge>
              <p className="text-sm leading-6 text-neutral-600">
                Thành viên này đang được xem trong phạm vi {getScopeLabel(scope).toLowerCase()}. Vai trò và quyền thao tác có thể khác nhau giữa tổ chức, sự kiện và đội nhóm.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

async function loadMembersByScope({ scope, organizationId, eventId, teamId }) {
  if (scope === 'team') {
    const response = await teamMemberApi.getByTeam(teamId)
    return normalizePageContent(response.data).map(normalizeTeamMember)
  }
  if (scope === 'event') {
    const response = await eventMemberApi.getByEvent(eventId)
    return normalizePageContent(response.data).map(normalizeEventMember)
  }
  const response = await organizationMemberApi.getByOrganization(organizationId)
  return normalizePageContent(response.data).map(normalizeOrganizationMember)
}

function normalizePageContent(data) {
  return Array.isArray(data) ? data : data?.content || []
}

function getScopeLabel(scope) {
  if (scope === 'team') return 'Thành viên đội nhóm'
  if (scope === 'event') return 'Thành viên sự kiện'
  return 'Thành viên tổ chức'
}

function getRoleLabel(scope, role) {
  if (scope === 'team') return teamMemberRoleLabels[role] || role || 'Thành viên'
  if (scope === 'event') return eventRoleLabels[role] || role || 'Thành viên'
  return organizationRoleLabels[role] || role || 'Thành viên'
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 py-3 last:border-b-0">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span>
        <span className="block text-xs font-bold uppercase text-neutral-500">{label}</span>
        <span className="mt-1 block text-sm font-semibold text-neutral-900">{value}</span>
      </span>
    </div>
  )
}

function MemberProfilePage() {
  const { organizationId, eventId, teamId, userId } = useParams()
  const location = useLocation()
  const [error, setError] = useState(null)
  const [successMessage] = useState(null)
  const scope = teamId ? 'team' : eventId ? 'event' : 'organization'
  const backPath = teamId
    ? `/organizations/${organizationId}/events/${eventId}/teams/${teamId}/members`
    : eventId
      ? `/organizations/${organizationId}/events/${eventId}/members`
      : `/organizations/${organizationId}/members`

  const content = (
    <MemberProfileContent
      scope={scope}
      organizationId={Number(organizationId)}
      eventId={eventId ? Number(eventId) : null}
      teamId={teamId ? Number(teamId) : null}
      userId={Number(userId)}
      initialMember={location.state?.member || null}
      backPath={backPath}
      onError={setError}
    />
  )

  if (scope === 'team') {
    return (
      <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
        {() => content}
      </TeamCaseLayout>
    )
  }

  if (scope === 'event') {
    return (
      <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
        {() => content}
      </EventCaseLayout>
    )
  }

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => content}
    </OrganizationCaseLayout>
  )
}

export default MemberProfilePage
