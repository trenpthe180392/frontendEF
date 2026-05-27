import { formatDateTime } from '../../utils/dateFormat'

function GeneratedAttendeePanel({ attendee }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary-bg p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_160px] md:items-start">
        <div>
          <p className="text-sm font-bold text-neutral-900">{attendee.fullName}</p>
          <p className="mt-1 text-sm text-neutral-600">{attendee.email || 'Chưa có email'} - {attendee.phone || 'Chưa có số điện thoại'}</p>
          <p className="mt-1 text-sm text-neutral-600">
            {[attendee.jobTitle, attendee.departmentName, attendee.companyName].filter(Boolean).join(' - ') || 'Chưa có chức danh/đơn vị'}
          </p>
          {attendee.note ? <p className="mt-2 text-sm text-neutral-600">{attendee.note}</p> : null}
          <p className="mt-3 text-xs font-semibold uppercase text-neutral-500">Mã mời</p>
          <p className="mt-1 font-mono text-lg font-bold text-neutral-900">{attendee.inviteCode}</p>
          <p className="mt-3 text-xs text-neutral-500">Hết hạn QR: {formatDateTime(attendee.qrExpiresAt)}</p>
        </div>
        {attendee.qrCodeDataUrl ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-2">
            <img src={attendee.qrCodeDataUrl} alt="" className="h-36 w-36 object-contain" />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default GeneratedAttendeePanel
