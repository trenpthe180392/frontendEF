import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, BarChart3, Building2, CalendarDays, ClipboardList, GitBranch, LayoutDashboard, Users } from 'lucide-react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'

import { organizationApi } from '../../api'
import AlertBanner from '../../components/feedback/AlertBanner'
import Card from '../../components/layout/Card'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getErrorMessage } from '../../utils'
import { normalizeOrganization } from '../../utils/organizationMappers'
import { getOrganizationImage } from './organizationConstants'

const organizationRoutes = [
  { to: '', label: 'Thông tin', icon: Building2, end: true },
  { to: 'members', label: 'Thành viên', icon: Users },
  { to: 'departments', label: 'Phòng ban', icon: GitBranch },
  { to: 'events', label: 'Sự kiện', icon: CalendarDays },
]

const eventRoutes = [
  { to: '', label: 'Thông tin', icon: Building2, end: true },
  { to: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { to: 'calendar', label: 'Lịch', icon: CalendarDays },
  { to: 'members', label: 'Thành viên', icon: Users },
  { to: 'teams', label: 'Đội nhóm', icon: BarChart3 },
  { to: 'tasks', label: 'Công việc', icon: ClipboardList },
]

const teamRoutes = [
  { to: '', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: 'calendar', label: 'Lịch', icon: CalendarDays },
  { to: 'members', label: 'Thành viên', icon: Users },
  { to: 'tasks', label: 'Công việc', icon: ClipboardList },
]

function OrganizationCaseLayout({ children, error, successMessage, onError }) {
  const { organizationId, eventId, teamId } = useParams()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadOrganization = useCallback(async () => {
    setIsLoading(true)
    onError(null)

    try {
      const response = await organizationApi.getById(organizationId)
      setOrganization(normalizeOrganization(response.data))
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, onError])

  useEffect(() => {
    loadOrganization()
  }, [loadOrganization])

  return (
    <main className="min-h-[calc(100vh-129px)] bg-neutral-100 p-6 text-neutral-700">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title={organization?.organizationName || 'Tổ chức'}
          subtitle="Quản lý từng phần bằng route riêng, liên kết qua organizationId."
          actions={
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/organizations')}>
              Quay lại
            </Button>
          }
        />

        <AlertBanner variant="error" message={error} />
        <AlertBanner variant="success" message={successMessage} />

        {isLoading ? (
          <Card>
            <div className="flex min-h-[360px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          </Card>
        ) : organization ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="h-fit overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:sticky lg:top-24">
              <div className="relative h-28 bg-neutral-200">
                <img
                  src={getOrganizationImage(organization)}
                  alt={organization.organizationName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                    {organization.logoUrl ? (
                      <img src={organization.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 size={20} className="text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 text-white">
                    <p className="truncate text-sm font-semibold">{organization.organizationName}</p>
                    <p className="text-xs text-neutral-200">{organization.type}</p>
                  </div>
                </div>
              </div>
              <div className="p-3">
              <SidebarSection
                title="Tổ chức"
                routes={organizationRoutes}
                basePath={`/organizations/${organization.id}`}
              />

              {eventId ? (
                <SidebarSection
                  title="Sự kiện"
                  routes={eventRoutes}
                  basePath={`/organizations/${organization.id}/events/${eventId}`}
                />
              ) : null}

              {teamId ? (
                <SidebarSection
                  title="Đội nhóm"
                  routes={teamRoutes}
                  basePath={`/organizations/${organization.id}/events/${eventId}/teams/${teamId}`}
                />
              ) : null}
              </div>
            </aside>

            <div className="min-w-0 space-y-4">{children(organization)}</div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

function SidebarSection({ title, routes, basePath }) {
  return (
    <div className="border-b border-neutral-200 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</p>
      <nav className="space-y-1">
        {routes.map((item) => {
          const Icon = item.icon
          const target = item.to ? `${basePath}/${item.to}` : basePath

          return (
            <NavLink
              key={`${title}-${item.label}`}
              to={target}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? 'flex h-10 items-center gap-3 rounded-lg bg-primary px-3 text-sm font-semibold text-white shadow-sm'
                  : 'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }
            >
              <Icon size={16} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export default OrganizationCaseLayout
