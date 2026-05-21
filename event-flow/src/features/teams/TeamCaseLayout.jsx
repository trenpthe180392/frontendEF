import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, BarChart3, CalendarDays, ClipboardList, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { teamApi } from '../../api'
import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getErrorMessage } from '../../utils'
import { statusVariant } from '../organizations/organizationConstants'
import EventCaseLayout from '../events/EventCaseLayout'

function TeamCaseLayout({ children, error, successMessage, onError }) {
  const { organizationId, eventId, teamId } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadTeam = useCallback(async () => {
    setIsLoading(true)
    onError(null)

    try {
      const response = await teamApi.getById(Number(teamId))
      setTeam(response.data)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [onError, teamId])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={onError}>
      {({ eventDetail }) =>
        isLoading ? (
          <Card>
            <div className="flex min-h-[260px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          </Card>
        ) : team ? (
          <div className="space-y-4">
            <section className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-neutral-900">{team.name}</h2>
                    <Badge variant={statusVariant[String(team.status || '').toLowerCase()] || 'default'}>{team.status || 'ACTIVE'}</Badge>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{team.description || 'Chưa có mô tả'}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-neutral-700">
                    <Info icon={<Users size={16} />} label={`${team.memberCount ?? 0} thành viên`} />
                    <Info icon={<ClipboardList size={16} />} label={`${team.taskCount ?? 0} công việc`} />
                    <Info icon={<CalendarDays size={16} />} label={`${team.calendarCount ?? 0} lịch`} />
                    <Info icon={<BarChart3 size={16} />} label={team.teamType || 'Đội nhóm'} />
                  </div>
                </div>
                <Button
                  variant="secondary"
                  leftIcon={<ArrowLeft size={16} />}
                  onClick={() => navigate(`/organizations/${organizationId}/events/${eventId}/teams`)}
                >
                  Danh sách đội nhóm
                </Button>
              </div>
            </section>

            {children({
              eventDetail,
              team,
              organizationId: Number(organizationId),
              eventId: Number(eventId),
              teamId: Number(teamId),
              reloadTeam: loadTeam,
            })}
          </div>
        ) : (
          <Card>
            <EmptyState icon={<Users size={24} />} title="Không tìm thấy đội nhóm" description="Đội nhóm có thể đã bị xóa hoặc bạn không có quyền xem." />
          </Card>
        )
      }
    </EventCaseLayout>
  )
}

function Info({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  )
}

export default TeamCaseLayout
