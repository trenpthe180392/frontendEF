import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3 } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { dashboardApi, teamApi } from '../api'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { getErrorMessage } from '../utils'

const statusSeries = [
  { key: 'todo', label: 'TODO', color: '#64748b' },
  { key: 'inProgress', label: 'IN_PROGRESS', color: '#2563eb' },
  { key: 'review', label: 'IN_REVIEW', color: '#f59e0b' },
  { key: 'done', label: 'DONE', color: '#16a34a' },
  { key: 'cancelled', label: 'CANCELLED', color: '#dc2626' },
]

function EventDashboardContent({ eventId, onError }) {
  const [dashboard, setDashboard] = useState(null)
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedTeamDashboard, setSelectedTeamDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTeamLoading, setIsTeamLoading] = useState(false)

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true)
      onError(null)
      setSelectedTeamId('')
      setSelectedTeamDashboard(null)

      try {
        const [dashboardResponse, teamsResponse] = await Promise.all([dashboardApi.getLeaderEvent(eventId), teamApi.getByEvent(eventId)])
        setDashboard(dashboardResponse.data)
        setTeams(teamsResponse.data || [])
      } catch (err) {
        onError(getErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [eventId, onError])

  useEffect(() => {
    async function loadTeamDashboard() {
      if (!selectedTeamId) {
        setSelectedTeamDashboard(null)
        return
      }

      setIsTeamLoading(true)
      onError(null)
      try {
        const response = await dashboardApi.getTeam(Number(selectedTeamId))
        setSelectedTeamDashboard(response.data)
      } catch (err) {
        setSelectedTeamDashboard(null)
        onError(getErrorMessage(err))
      } finally {
        setIsTeamLoading(false)
      }
    }

    loadTeamDashboard()
  }, [selectedTeamId, onError])

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[260px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Card>
    )
  }

  const selectedTeam = teams.find((team) => String(team.id) === String(selectedTeamId))
  const isTeamView = Boolean(selectedTeamId)
  const columnData = isTeamView ? selectedTeamDashboard?.columnChartData || [] : dashboard?.projectColumnChartData || []
  const lineData = isTeamView ? selectedTeamDashboard?.lineChartData || [] : dashboard?.projectLineChartData || []
  const totalTasks = columnData.reduce((total, item) => total + Number(item.count || 0), 0)
  const doneTasks = columnData.find((item) => item.status === 'DONE')?.count || 0
  const updateCount = lineData.reduce(
    (total, item) => total + statusSeries.reduce((sum, series) => sum + Number(item[series.key] || 0), 0),
    0
  )
  const dashboardTitle = isTeamView ? selectedTeamDashboard?.teamName || selectedTeam?.name || 'Đội nhóm' : 'Ban tổ chức'

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Bảng điều khiển vận hành"
        description="Theo dõi tiến độ công việc, nhịp cập nhật và hiệu suất theo toàn sự kiện hoặc từng đội nhóm."
        icon={<BarChart3 size={24} />}
        actions={
          <div className="w-full sm:w-72">
            <Select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
              <option value="">Ban tổ chức</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
        }
        stats={[
          { label: 'Công việc', value: totalTasks },
          { label: 'Hoàn thành', value: `${doneTasks}/${totalTasks}` },
          { label: 'Cập nhật', value: updateCount },
          { label: isTeamView ? 'Đội nhóm' : 'Đội nhóm', value: isTeamView ? dashboardTitle : teams.length },
        ]}
      />

      {isTeamLoading ? (
        <Card>
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Card>
      ) : null}

      {!isTeamLoading ? (
        <>
          <Card title={`Cập nhật công việc theo ngày - ${dashboardTitle}`}>
            {lineData.length === 0 ? (
              <EmptyState icon={<Activity size={24} />} title="Chưa có dữ liệu cập nhật" description="Khi công việc đổi trạng thái, biểu đồ sẽ cập nhật theo ngày." />
            ) : (
              <StatusLineChart data={lineData} />
            )}
          </Card>

          <Card title={`Số lượng công việc theo trạng thái - ${dashboardTitle}`}>
            {columnData.length === 0 ? (
              <EmptyState icon={<BarChart3 size={24} />} title="Chưa có công việc" description="Biểu đồ cột sẽ hiển thị tại đây." />
            ) : (
              <StatusColumnChart data={columnData} />
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}

function StatusLineChart({ data, compact = false }) {
  const chart = useMemo(() => buildChart(data), [data])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {statusSeries.map((series) => (
          <div key={series.key} className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <svg className={compact ? 'h-[280px] w-full text-neutral-500' : 'h-[360px] w-full text-neutral-500'} viewBox="0 0 920 360" role="img" aria-label="Task status updates line chart">
          {chart.yTicks.map((tick) => (
            <g key={tick.value}>
              <line x1="60" x2="890" y1={tick.y} y2={tick.y} stroke="#e5e7eb" strokeWidth="1" />
              <text x="48" y={tick.y + 4} textAnchor="end" className="fill-neutral-500 text-[11px]">
                {tick.value}
              </text>
            </g>
          ))}

          {chart.xTicks.map((tick) => (
            <text key={tick.index} x={tick.x} y="334" textAnchor="middle" className="fill-neutral-500 text-[11px]">
              {tick.label}
            </text>
          ))}

          {chart.lines.map((line) => (
            <g key={line.key}>
              <polyline fill="none" stroke={line.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={line.points} />
              {line.nodes.map((node) => (
                <circle key={`${line.key}-${node.x}-${node.y}`} cx={node.x} cy={node.y} r="3.5" fill={line.color} />
              ))}
            </g>
          ))}

          <line x1="60" x2="890" y1="306" y2="306" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="60" x2="60" y1="24" y2="306" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      </div>
    </div>
  )
}

function StatusColumnChart({ data, compact = false }) {
  const chart = useMemo(() => buildColumnChart(data), [data])

  return (
    <div className="space-y-4">
      <div className={compact ? 'h-[280px] overflow-hidden' : 'h-[340px] overflow-hidden'}>
        <svg className="h-full w-full text-neutral-500" viewBox="0 0 520 360" role="img" aria-label="Task status count column chart">
          {chart.yTicks.map((tick) => (
            <g key={tick.value}>
              <line x1="54" x2="492" y1={tick.y} y2={tick.y} stroke="#e5e7eb" strokeWidth="1" />
              <text x="44" y={tick.y + 4} textAnchor="end" className="fill-neutral-500 text-[11px]">
                {tick.value}
              </text>
            </g>
          ))}

          {chart.bars.map((bar) => (
            <g key={bar.status}>
              <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx="6" fill={bar.color} />
              <text x={bar.x + bar.width / 2} y={bar.y - 8} textAnchor="middle" className="fill-neutral-700 text-[12px] font-semibold">
                {bar.count}
              </text>
              <text x={bar.x + bar.width / 2} y="334" textAnchor="middle" className="fill-neutral-500 text-[10px]">
                {bar.label}
              </text>
            </g>
          ))}

          <line x1="54" x2="492" y1="306" y2="306" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="54" x2="54" y1="24" y2="306" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      </div>

      <div className="flex flex-wrap gap-3">
        {chart.bars.map((bar) => (
          <div key={bar.status} className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bar.color }} />
            {bar.status}
          </div>
        ))}
      </div>
    </div>
  )
}

function buildChart(data) {
  const width = 830
  const height = 282
  const left = 60
  const top = 24
  const bottom = top + height
  const maxValue = Math.max(1, ...data.flatMap((item) => statusSeries.map((series) => Number(item[series.key] || 0))))
  const yMax = Math.max(5, Math.ceil(maxValue / 5) * 5)
  const stepX = data.length > 1 ? width / (data.length - 1) : width

  const scaleY = (value) => bottom - (Number(value || 0) / yMax) * height
  const formatDateLabel = (date) => {
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return new globalThis.Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(parsed)
  }

  const lines = statusSeries.map((series) => {
    const nodes = data.map((item, index) => ({
      x: left + index * stepX,
      y: scaleY(item[series.key]),
    }))

    return {
      ...series,
      nodes,
      points: nodes.map((node) => `${node.x},${node.y}`).join(' '),
    }
  })

  const yTicks = Array.from({ length: 6 }, (_, index) => {
    const value = Math.round((yMax / 5) * index)
    return {
      value,
      y: scaleY(value),
    }
  }).reverse()

  const tickEvery = Math.max(1, Math.ceil(data.length / 8))
  const xTicks = data
    .map((item, index) => ({
      index,
      x: left + index * stepX,
      label: formatDateLabel(item.date),
    }))
    .filter((_, index) => index % tickEvery === 0 || index === data.length - 1)

  return { lines, yTicks, xTicks }
}

function buildColumnChart(data) {
  const left = 54
  const top = 24
  const bottom = 306
  const height = bottom - top
  const width = 438
  const maxValue = Math.max(1, ...data.map((item) => Number(item.count || 0)))
  const yMax = Math.max(5, Math.ceil(maxValue / 5) * 5)
  const gap = 18
  const barWidth = Math.min(58, (width - gap * (data.length + 1)) / Math.max(1, data.length))
  const getColor = (status) => {
    const series = statusSeries.find((item) => item.label === status)
    return series?.color || '#64748b'
  }

  const bars = data.map((item, index) => {
    const count = Number(item.count || 0)
    const barHeight = (count / yMax) * height
    const x = left + gap + index * (barWidth + gap)
    const y = bottom - barHeight

    return {
      status: item.status,
      label: String(item.status || '').replace('IN_', ''),
      count,
      x,
      y,
      width: barWidth,
      height: Math.max(0, barHeight),
      color: getColor(item.status),
    }
  })

  const yTicks = Array.from({ length: 6 }, (_, index) => {
    const value = Math.round((yMax / 5) * index)
    return {
      value,
      y: bottom - (value / yMax) * height,
    }
  }).reverse()

  return { bars, yTicks }
}

function EventDashboardPage() {
  const { eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => <EventDashboardContent eventId={Number(eventId)} onError={setError} />}
    </EventCaseLayout>
  )
}

export default EventDashboardPage
