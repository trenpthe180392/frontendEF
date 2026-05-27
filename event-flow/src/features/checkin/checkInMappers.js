export function normalizeSession(session) {
  return {
    id: session.id,
    eventId: session.eventId,
    name: session.name || 'Phiên check-in',
    description: session.description || '',
    startTime: session.startTime || null,
    endTime: session.endTime || null,
    location: session.location || '',
    status: session.status || 'SCHEDULED',
    createdBy: session.createdBy || null,
    createAt: session.createAt || null,
    updateAt: session.updateAt || null,
  }
}

export function normalizeAttendee(attendee) {
  return {
    id: attendee.id,
    eventId: attendee.eventId,
    fullName: attendee.fullName || 'Người tham dự',
    email: attendee.email || '',
    phone: attendee.phone || '',
    jobTitle: attendee.jobTitle || '',
    companyName: attendee.companyName || '',
    departmentName: attendee.departmentName || '',
    guestType: attendee.guestType || 'STANDARD',
    note: attendee.note || '',
    inviteCode: attendee.inviteCode || '',
    qrPayload: attendee.qrPayload || '',
    qrCodeDataUrl: attendee.qrCodeDataUrl || '',
    qrIssuedAt: attendee.qrIssuedAt || null,
    qrExpiresAt: attendee.qrExpiresAt || null,
    status: attendee.status || 'INVITED',
    source: attendee.source || 'MANUAL',
  }
}

export function normalizeRecord(record) {
  return {
    id: record.id,
    sessionId: record.sessionId,
    attendeeId: record.attendeeId,
    attendeeName: record.attendeeName || 'Người tham dự',
    attendeeEmail: record.attendeeEmail || '',
    attendeePhone: record.attendeePhone || '',
    attendeeJobTitle: record.attendeeJobTitle || '',
    attendeeCompanyName: record.attendeeCompanyName || '',
    attendeeDepartmentName: record.attendeeDepartmentName || '',
    attendeeGuestType: record.attendeeGuestType || '',
    inviteCode: record.inviteCode || '',
    checkedInAt: record.checkedInAt || null,
    checkedInBy: record.checkedInBy || null,
    method: record.method || 'MANUAL',
    status: record.status || 'CHECKED_IN',
    note: record.note || '',
    createAt: record.createAt || null,
    updateAt: record.updateAt || null,
  }
}
