import { ScanLine } from 'lucide-react'

import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import CheckInAttendeeForm from './CheckInAttendeeForm'
import CheckInAttendeeList from './CheckInAttendeeList'
import { sessionStatusLabels, sessionStatusVariants } from './checkInConstants'
import GeneratedAttendeePanel from './GeneratedAttendeePanel'

function CheckInWorkspacePanel({
  session,
  attendees,
  attendeeForm,
  attendeeErrors,
  generatedAttendee,
  isAttendeeSubmitting,
  inviteActionId,
  onAttendeeChange,
  onAttendeeSubmit,
  onResendInvite,
  pagination,
}) {
  const sessionClosed = session?.status !== 'OPEN'

  return (
    <Card title={session ? `Người tham dự: ${session.name}` : 'Người tham dự'}>
      {!session ? (
        <EmptyState
          icon={<ScanLine size={24} />}
          title="Chưa chọn phiên"
          description="Chọn một phiên ở bên trái để xem danh sách, thêm người tham dự và check-in."
        />
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={sessionStatusVariants[session.status] || 'default'}>
                {sessionStatusLabels[session.status] || session.status}
              </Badge>
              {sessionClosed ? <Badge variant="warning">Chưa nhận check-in</Badge> : null}
            </div>
          </div>

          <CheckInAttendeeForm
            form={attendeeForm}
            errors={attendeeErrors}
            isSubmitting={isAttendeeSubmitting}
            disabled={!session}
            onChange={onAttendeeChange}
            onSubmit={onAttendeeSubmit}
          />

          {generatedAttendee ? <GeneratedAttendeePanel attendee={generatedAttendee} /> : null}

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase text-neutral-900">Danh sách người tham dự</h3>
            <CheckInAttendeeList attendees={attendees} inviteActionId={inviteActionId} onResendInvite={onResendInvite} />
            {pagination}
          </div>
        </div>
      )}
    </Card>
  )
}

export default CheckInWorkspacePanel
