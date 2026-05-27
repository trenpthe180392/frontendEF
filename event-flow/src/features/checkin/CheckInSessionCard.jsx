import { Eye, Pencil, Trash2 } from 'lucide-react'

import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { formatDateTime } from '../../utils/dateFormat'
import { sessionStatusLabels, sessionStatusVariants } from './checkInConstants'

function CheckInSessionCard({ session, selected, deleting, onEdit, onDelete, onSelect }) {
  return (
    <article className={selected ? 'rounded-xl border border-primary bg-primary-bg p-4' : 'rounded-xl border border-neutral-200 bg-white p-4'}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900">{session.name}</h2>
            <Badge variant={sessionStatusVariants[session.status] || 'default'}>
              {sessionStatusLabels[session.status] || session.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-500">{session.location || 'Chưa có địa điểm'}</p>
          <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{session.description || 'Chưa có mô tả phiên.'}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-neutral-500 sm:grid-cols-2">
            <p>Bắt đầu: <span className="font-semibold text-neutral-700">{formatDateTime(session.startTime)}</span></p>
            <p>Kết thúc: <span className="font-semibold text-neutral-700">{formatDateTime(session.endTime)}</span></p>
            <p>Người tạo: <span className="font-semibold text-neutral-700">{session.createdBy || 'Chưa có'}</span></p>
            <p>Cập nhật: <span className="font-semibold text-neutral-700">{formatDateTime(session.updateAt || session.createAt)}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="primary" size="sm" leftIcon={<Eye size={16} />} onClick={() => onSelect(session)}>
            Xem
          </Button>
          <Button type="button" variant="secondary" size="sm" leftIcon={<Pencil size={16} />} onClick={() => onEdit(session)}>
            Sửa
          </Button>
          <Button type="button" variant="ghost" size="sm" leftIcon={<Trash2 size={16} />} loading={deleting} onClick={() => onDelete(session)}>
            Xóa
          </Button>
        </div>
      </div>
    </article>
  )
}

export default CheckInSessionCard
