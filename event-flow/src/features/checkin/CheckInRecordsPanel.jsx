import { ClipboardList, RefreshCw } from 'lucide-react'

import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDateTime } from '../../utils/dateFormat'
import { methodLabels, recordStatusLabels, recordStatusVariants } from './checkInConstants'

function CheckInRecordsPanel({ session, records, isLoading, error, onRefresh, pagination }) {
  return (
    <Card
      title={session ? `Records: ${session.name}` : 'Records phiên'}
      headerRight={
        session ? (
          <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={onRefresh}>
            Tải lại
          </Button>
        ) : null
      }
    >
      {!session ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Chưa chọn phiên"
          description="Chọn một phiên check-in để xem danh sách người đã ghi nhận."
        />
      ) : isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Không thể tải records"
          description={error}
          action={
            <Button type="button" variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={onRefresh}>
              Thử lại
            </Button>
          }
        />
      ) : records.length === 0 ? (
        <div>
          <EmptyState
            icon={<ClipboardList size={24} />}
            title="Chưa có record"
            description="Khi QR hoặc mã mời được ghi nhận, record sẽ xuất hiện tại đây."
          />
          {pagination}
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <article key={record.id} className="rounded-xl border border-neutral-200 bg-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900">{record.attendeeName}</p>
                  <p className="mt-1 text-xs text-neutral-500">{record.attendeeEmail || 'Chưa có email'} - {record.attendeePhone || 'Chưa có số điện thoại'}</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {[record.attendeeJobTitle, record.attendeeDepartmentName, record.attendeeCompanyName].filter(Boolean).join(' - ') || 'Chưa có chức danh/đơn vị'}
                  </p>
                  <p className="mt-1 font-mono text-xs font-semibold text-neutral-700">{record.inviteCode || 'Chưa có mã mời'}</p>
                </div>
                <Badge variant={recordStatusVariants[record.status] || 'default'}>{recordStatusLabels[record.status] || record.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-neutral-500 sm:grid-cols-2">
                <p>Thời điểm: <span className="font-semibold text-neutral-700">{formatDateTime(record.checkedInAt)}</span></p>
                <p>Phương thức: <span className="font-semibold text-neutral-700">{methodLabels[record.method] || record.method}</span></p>
                <p>Nhân sự: <span className="font-semibold text-neutral-700">{record.checkedInBy || 'Chưa có'}</span></p>
                <p>Ghi chú: <span className="font-semibold text-neutral-700">{record.note || 'Không có'}</span></p>
              </div>
            </article>
          ))}
          {pagination}
        </div>
      )}
    </Card>
  )
}

export default CheckInRecordsPanel
