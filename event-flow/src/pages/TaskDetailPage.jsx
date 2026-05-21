import { useEffect, useState } from 'react'
import { ArrowLeft, FileText, Paperclip, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { attachmentApi, taskApi } from '../api'
import Card from '../components/layout/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EventCaseLayout from '../features/events/EventCaseLayout'
import TeamCaseLayout from '../features/teams/TeamCaseLayout'
import { statusVariant } from '../features/organizations/organizationConstants'
import { getErrorMessage } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

function formatFileSize(value) {
  const size = Number(value || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function TaskDetailContent({ taskId, backPath, onError, onSuccess }) {
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null)

  async function loadTask() {
    setIsLoading(true)
    onError(null)

    try {
      const response = await taskApi.getById(taskId)
      setTask(response.data)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  async function handleUpload(file) {
    if (!file) return
    setIsUploading(true)
    onError(null)
    onSuccess(null)

    try {
      await attachmentApi.upload(taskId, file)
      await loadTask()
      onSuccess('Đã tải tệp đính kèm')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDeleteAttachment(attachment) {
    if (!attachment?.id) return
    setDeletingAttachmentId(attachment.id)
    onError(null)
    onSuccess(null)

    try {
      await attachmentApi.delete(attachment.id)
      await loadTask()
      onSuccess('Đã xóa tệp đính kèm')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  const deadline = task?.dueTime || task?.deadline || task?.dueDate

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">Chi tiết công việc</p>
            <h1 className="mt-1 text-2xl font-bold text-neutral-900">{task?.title || 'Đang tải công việc...'}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={loadTask} loading={isLoading}>
              Tải lại
            </Button>
            <Button type="button" variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(backPath)}>
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </section>

      {isLoading && !task ? (
        <Card>
          <div className="flex min-h-[260px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Card>
      ) : task ? (
        <>
          <Card title="Thông tin công việc">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant[String(task.status || '').toLowerCase()] || 'default'}>{task.status || 'TODO'}</Badge>
              <Badge variant="default">{task.priority || 'MEDIUM'}</Badge>
              <span className="text-sm font-medium text-neutral-600">{task.progress ?? 0}%</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-700">{task.description || 'Chưa có mô tả'}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <Info label="Sự kiện" value={task.eventName || 'Chưa có'} />
              <Info label="Đội nhóm" value={task.teamName || 'Chưa có'} />
              <Info label="Người phụ trách" value={task.assignedTo || task.assigneeName || 'Chưa có'} />
              <Info label="Hạn hoàn thành" value={formatDateTime(deadline)} />
            </div>
          </Card>

          <Card
            title="Tệp đính kèm"
            headerRight={
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-light">
                <Upload size={16} />
                {isUploading ? 'Đang tải lên...' : 'Tải tệp lên'}
                <input type="file" className="hidden" disabled={isUploading} onChange={(event) => handleUpload(event.target.files?.[0])} />
              </label>
            }
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <Paperclip size={18} className="text-primary" />
              {(task.attachments || []).length} tệp đính kèm
            </div>
            {(task.attachments || []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
                Chưa có tệp đính kèm
              </div>
            ) : (
              <div className="space-y-3">
                {(task.attachments || []).map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3">
                    <a
                      className="flex min-w-0 items-center gap-3 text-sm font-semibold text-neutral-900 hover:text-primary"
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText size={18} className="shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block truncate">{attachment.fileName}</span>
                        <span className="block text-xs font-medium text-neutral-500">
                          {formatFileSize(attachment.fileSize)} - {attachment.uploadedBy || attachment.uploadedByFullName || 'Không rõ'}
                        </span>
                      </span>
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 size={16} />}
                      loading={deletingAttachmentId === attachment.id}
                      onClick={() => handleDeleteAttachment(attachment)}
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-1 font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function TaskDetailPage() {
  const { organizationId, eventId, teamId, taskId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const backPath = teamId
    ? `/organizations/${organizationId}/events/${eventId}/teams/${teamId}/tasks`
    : `/organizations/${organizationId}/events/${eventId}/tasks`

  if (teamId) {
    return (
      <TeamCaseLayout error={error} successMessage={successMessage} onError={setError}>
        {() => (
          <TaskDetailContent
            taskId={Number(taskId)}
            backPath={backPath}
            onError={setError}
            onSuccess={setSuccessMessage}
          />
        )}
      </TeamCaseLayout>
    )
  }

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <TaskDetailContent
          taskId={Number(taskId)}
          backPath={backPath}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default TaskDetailPage
