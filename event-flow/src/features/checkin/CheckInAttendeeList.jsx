import { Mail, Users } from 'lucide-react'

import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { statusVariant } from '../organizations/organizationConstants'
import { attendeeGuestTypeOptions } from './checkInConstants'

const attendeeStatusLabels = {
  INVITED: 'Đã mời',
  REGISTERED: 'Đã đăng ký',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
}

const guestTypeLabels = Object.fromEntries(attendeeGuestTypeOptions.map((option) => [option.value, option.label]))

function CheckInAttendeeList({ attendees, inviteActionId = null, onResendInvite = null }) {
  if (attendees.length === 0) {
    return (
      <EmptyState
        icon={<Users size={24} />}
        title="Chưa có người tham dự"
        description="Thêm người tham dự vào phiên để hệ thống sinh mã mời và QR."
      />
    )
  }

  return (
    <div className="space-y-3">
      {attendees.map((attendee) => (
        <article key={attendee.id} className="rounded-xl border border-neutral-200 bg-white p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-neutral-900">{attendee.fullName}</p>
                <Badge variant={statusVariant[String(attendee.status || '').toLowerCase()] || 'default'}>
                  {attendeeStatusLabels[attendee.status] || attendee.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{attendee.email || 'Chưa có email'} - {attendee.phone || 'Chưa có số điện thoại'}</p>
              <p className="mt-1 text-xs text-neutral-600">
                {[attendee.jobTitle, attendee.departmentName, attendee.companyName].filter(Boolean).join(' - ') || 'Chưa có chức danh/đơn vị'}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {guestTypeLabels[attendee.guestType] || attendee.guestType || 'Khách tham dự'}
                {attendee.note ? ` - ${attendee.note}` : ''}
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-neutral-700">{attendee.inviteCode || 'Chưa có mã mời'}</p>
            </div>
            {onResendInvite ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Mail size={16} />}
                loading={inviteActionId === attendee.id}
                disabled={!attendee.email}
                onClick={() => onResendInvite(attendee)}
              >
                Gửi QR
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

export default CheckInAttendeeList
