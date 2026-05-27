import { useEffect, useState } from 'react'
import { CalendarClock, ClipboardCheck, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { taskApi } from '../api'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import PaginationControls from '../components/ui/PaginationControls'
import Select from '../components/ui/Select'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { taskStatusOptions } from '../features/events/eventPageUtils'
import { statusVariant } from '../features/organizations/organizationConstants'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const DEFAULT_ASSIGNED_TASKS_PER_PAGE = 10

function normalizeTaskPage(responseData, pageSize = DEFAULT_ASSIGNED_TASKS_PER_PAGE) {
  if (Array.isArray(responseData)) {
    return {
      content: responseData,
      totalElements: responseData.length,
      totalPages: Math.max(1, Math.ceil(responseData.length / pageSize)),
      number: 0,
    }
  }

  const page = responseData?.page || {}
  return {
    content: responseData?.content || [],
    totalElements: responseData?.totalElements ?? page.totalElements ?? 0,
    totalPages: Math.max(1, responseData?.totalPages ?? page.totalPages ?? 1),
    number: responseData?.number ?? page.number ?? 0,
  }
}

function EventAssignedTasksContent({ organizationId, eventId, onError }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_ASSIGNED_TASKS_PER_PAGE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  async function loadAssignedTasks() {
    onError(null)

    try {
      const response = await taskApi.getAssignedByEvent(eventId, {
        page: currentPage - 1,
        size: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      })
      const taskPage = normalizeTaskPage(response.data, pageSize)
      setTasks(taskPage.content)
      setTotalElements(taskPage.totalElements)
      setTotalPages(taskPage.totalPages)
      setCurrentPage(taskPage.number + 1)
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadAssignedTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, currentPage, pageSize, statusFilter])

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value)
    setCurrentPage(1)
  }

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  return (
    <>
      <EventWorkspaceHeader
        title="Công việc được giao"
        description="Theo dõi các công việc được phân công trực tiếp cho bạn trong sự kiện."
        icon={<ClipboardCheck size={24} />}
        stats={[
          { label: 'Được giao', value: totalElements },
          { label: 'Đang hiển thị', value: tasks.length },
          { label: 'Trang', value: `${currentPage}/${totalPages}` },
          { label: 'Bộ lọc', value: statusFilter },
        ]}
      />

      <Card
        title="Việc của tôi"
        headerRight={
          <div className="w-full sm:w-56">
            <Select value={statusFilter} onChange={handleStatusFilterChange}>
              <option value="ALL">Tất cả trạng thái</option>
              {taskStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        {tasks.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={24} />}
            title={statusFilter === 'ALL' ? 'Chưa có công việc được giao' : 'Không có công việc phù hợp'}
            description={statusFilter === 'ALL'
              ? 'Khi trưởng sự kiện hoặc trưởng đội phân công, công việc sẽ xuất hiện tại đây.'
              : 'Đổi trạng thái lọc để xem công việc khác.'}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tasks.map((task) => (
              <article key={task.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant[String(task.status || '').toLowerCase()] || 'default'}>
                        {task.status || 'TODO'}
                      </Badge>
                      <Badge variant="info">{task.priority || 'MEDIUM'}</Badge>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-neutral-900">{task.title}</h3>
                    {task.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-500">{task.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock size={14} />
                        {formatDateTime(task.dueTime)}
                      </span>
                      <span>{task.teamName || 'Chưa gán đội nhóm'}</span>
                      <span>Tiến độ {task.progress ?? 0}%</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye size={16} />}
                    onClick={() => navigate(`/organizations/${organizationId}/events/${eventId}/tasks/${task.id}`)}
                  >
                    Xem chi tiết
                  </Button>
                </div>
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
    </>
  )
}

function EventAssignedTasksPage() {
  const [error, setError] = useState(null)
  const [successMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ organizationId, eventId }) => (
        <EventAssignedTasksContent
          organizationId={organizationId}
          eventId={eventId}
          onError={setError}
        />
      )}
    </EventCaseLayout>
  )
}

export { EventAssignedTasksContent }
export default EventAssignedTasksPage
