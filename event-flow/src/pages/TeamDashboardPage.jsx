import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, ClipboardList } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { dashboardApi } from '../api'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Spinner from '../components/ui/Spinner'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { getErrorMessage } from '../utils'

const statusSeries = [
  { key: 'todo', label: 'TODO', color: '#64748b' },
  { key: 'inProgress', label: 'IN_PROGRESS', color: '#2563eb' },
  { key: 'review', label: 'IN_REVIEW', color: '#f59e0b' },
  { key: 'done', label: 'DONE', color: '#16a34a' },
  { key: 'cancelled', label: 'CANCELLED', color: '#dc2626' },
]

function TeamDashboardContent({ teamId, onError }) {
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true)
      onError(null)
      try {
        const response = await dashboardApi.getTeam(teamId)
        setDashboard(response.data)
      } catch (err) {
        onError(getErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [onError, teamId])

  if (isLoading) {
    return (
      <Card>
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Card>
    )
  }

  const columnData = dashboard?.columnChartData || []
  const lineData = dashboard?.lineChartData || []
  const totalTasks = columnData.reduce((total, item) => total + Number(item.count || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricCard icon={<ClipboardList size={18} />} label="Tổng công việc" value={totalTasks} />
        <MetricCard icon={<Activity size={18} />} label="Cập nhật" value={countUpdates(lineData)} />
        <MetricCard icon={<BarChart3 size={18} />} label="Trạng thái" value={columnData.length} />
      </div>

      <Card title="Cập nhật công việc theo ngày">
        {lineData.length === 0 ? (
          <EmptyState icon={<Activity size={24} />} title="Chưa có dữ liệu" description="Khi công việc đổi trạng thái, biểu đồ sẽ cập nhật theo ngày." />
        ) : (
          <MiniLineChart data={lineData} />
        )}
      </Card>

      <Card title="Số lượng công việc theo trạng thái">
        {columnData.length === 0 ? (
          <EmptyState icon={<BarChart3 size={24} />} title="Chưa có công việc" description="Số lượng công việc theo trạng thái sẽ hiển thị tại đây." />
        ) : (
          <MiniColumnChart data={columnData} />
        )}
      </Card>
    </div>
  )
}

function countUpdates(data) {
  return data.reduce((total, item) => total + statusSeries.reduce((sum, series) => sum + Number(item[series.key] || 0), 0), 0)
}

function MetricCard({ icon, label, value }) {
  return (
    <Card className="rounded-lg">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
    </Card>
  )
}

function MiniLineChart({ data }) {
  const chart = useMemo(() => buildLineChart(data), [data])

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <svg className="h-[340px] w-full" viewBox="0 0 860 320" role="img" aria-label="Team task update line chart">
        {chart.yTicks.map((tick) => (
          <g key={tick.value}>
            <line x1="56" x2="828" y1={tick.y} y2={tick.y} stroke="#e5e7eb" />
            <text x="44" y={tick.y + 4} textAnchor="end" className="fill-neutral-500 text-[11px]">
              {tick.value}
            </text>
          </g>
        ))}
        {chart.xTicks.map((tick) => (
          <text key={tick.index} x={tick.x} y="300" textAnchor="middle" className="fill-neutral-500 text-[11px]">
            {tick.label}
          </text>
        ))}
        {chart.lines.map((line) => (
          <polyline key={line.key} fill="none" stroke={line.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={line.points} />
        ))}
        <line x1="56" x2="828" y1="274" y2="274" stroke="#cbd5e1" />
        <line x1="56" x2="56" y1="24" y2="274" stroke="#cbd5e1" />
      </svg>
    </div>
  )
}

function MiniColumnChart({ data }) {
  const chart = useMemo(() => buildColumnChart(data), [data])

  return (
    <div className="space-y-4">
      <div className="h-[320px] overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <svg className="h-full w-full text-neutral-500" viewBox="0 0 520 340" role="img" aria-label="Team task status column chart">
          {chart.yTicks.map((tick) => (
            <g key={tick.value}>
              <line x1="54" x2="492" y1={tick.y} y2={tick.y} stroke="#e5e7eb" />
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
              <text x={bar.x + bar.width / 2} y="316" textAnchor="middle" className="fill-neutral-500 text-[10px]">
                {bar.label}
              </text>
            </g>
          ))}
          <line x1="54" x2="492" y1="292" y2="292" stroke="#cbd5e1" />
          <line x1="54" x2="54" y1="24" y2="292" stroke="#cbd5e1" />
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

function buildLineChart(data) {
  const left = 56
  const top = 24
  const width = 772
  const height = 250
  const bottom = top + height
  const maxValue = Math.max(1, ...data.flatMap((item) => statusSeries.map((series) => Number(item[series.key] || 0))))
  const yMax = Math.max(5, Math.ceil(maxValue / 5) * 5)
  const stepX = data.length > 1 ? width / (data.length - 1) : width
  const scaleY = (value) => bottom - (Number(value || 0) / yMax) * height
  const formatDate = (date) => new globalThis.Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(date))

  return {
    lines: statusSeries.map((series) => ({
      ...series,
      points: data.map((item, index) => `${left + index * stepX},${scaleY(item[series.key])}`).join(' '),
    })),
    yTicks: Array.from({ length: 6 }, (_, index) => {
      const value = Math.round((yMax / 5) * index)
      return { value, y: scaleY(value) }
    }).reverse(),
    xTicks: data
      .map((item, index) => ({ index, x: left + index * stepX, label: formatDate(item.date) }))
      .filter((_, index) => index % Math.max(1, Math.ceil(data.length / 8)) === 0 || index === data.length - 1),
  }
}

function buildColumnChart(data) {
  const left = 54
  const top = 24
  const bottom = 292
  const height = bottom - top
  const width = 438
  const maxValue = Math.max(1, ...data.map((item) => Number(item.count || 0)))
  const yMax = Math.max(5, Math.ceil(maxValue / 5) * 5)
  const gap = 18
  const barWidth = Math.min(58, (width - gap * (data.length + 1)) / Math.max(1, data.length))
  const getColor = (status) => statusSeries.find((item) => item.label === status)?.color || '#64748b'

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
    return { value, y: bottom - (value / yMax) * height }
  }).reverse()

  return { bars, yTicks }
}

function TeamDashboardPage() {
  const { teamId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage] = useState(null)

  return (
    <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => <TeamDashboardContent teamId={Number(teamId)} onError={setError} />}
    </TeamCaseLayout>
  )
}

export default TeamDashboardPage
