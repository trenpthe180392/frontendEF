import { FileText, Paperclip, Trash2, Upload, X } from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { statusVariant } from '../organizations/organizationConstants'
import { formatDateTime } from '../../utils/dateFormat'

function formatFileSize(value) {
  const size = Number(value || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function TaskDetailPanel({
  open,
  task,
  isLoading,
  isUploading,
  deletingAttachmentId,
  onClose,
  onUpload,
  onDeleteAttachment,
}) {
  if (!open) return null

  const deadline = task?.dueTime || task?.deadline || task?.dueDate

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/40">
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">Chi tiết công việc</p>
            <h2 className="mt-1 text-xl font-bold text-neutral-900">{task?.title || 'Đang tải...'}</h2>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" leftIcon={<X size={16} />} onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {isLoading ? (
            <div className="rounded-lg border border-neutral-200 p-6 text-center text-sm font-medium text-neutral-500">Đang tải chi tiết công việc...</div>
          ) : task ? (
            <>
              <section className="rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant[String(task.status || '').toLowerCase()] || 'default'}>{task.status}</Badge>
                  <Badge variant="default">{task.priority || 'MEDIUM'}</Badge>
                  <span className="text-sm font-medium text-neutral-600">{task.progress ?? 0}%</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-neutral-700">{task.description || 'Chưa có mô tả'}</p>
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <Info label="Sự kiện" value={task.eventName || 'Chưa có'} />
                  <Info label="Đội nhóm" value={task.teamName || 'Chưa có'} />
                  <Info label="Người phụ trách" value={task.assignedTo || 'Chưa có'} />
                  <Info label="Hạn hoàn thành" value={formatDateTime(deadline)} />
                </div>
              </section>

              <section className="rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip size={18} className="text-primary" />
                    <h3 className="font-semibold text-neutral-900">Tệp đính kèm</h3>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-light">
                    <Upload size={16} />
                    {isUploading ? 'Đang tải lên...' : 'Tải tệp lên'}
                    <input type="file" className="hidden" disabled={isUploading} onChange={(event) => onUpload(event.target.files?.[0])} />
                  </label>
                </div>

                {(task.attachments || []).length === 0 ? (
                  <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
                    Chưa có tệp đính kèm
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
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
                          onClick={() => onDeleteAttachment(attachment)}
                        >
                          Xóa
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </aside>
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

export default TaskDetailPanel
