export const emptySessionForm = {
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  status: 'SCHEDULED',
}

export const emptyAttendeeForm = {
  fullName: '',
  email: '',
  phone: '',
  jobTitle: '',
  companyName: '',
  departmentName: '',
  guestType: 'STANDARD',
  note: '',
}

export const attendeeGuestTypeOptions = [
  { value: 'STANDARD', label: 'Khách tham dự' },
  { value: 'VIP', label: 'VIP' },
  { value: 'SPEAKER', label: 'Diễn giả' },
  { value: 'SPONSOR', label: 'Nhà tài trợ' },
  { value: 'PRESS', label: 'Báo chí' },
  { value: 'STAFF_GUEST', label: 'Khách nội bộ' },
]

export const emptyScanForm = {
  lookupType: 'inviteCode',
  lookupValue: '',
  note: '',
}

export const sessionStatusOptions = ['SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED']

export const sessionStatusLabels = {
  SCHEDULED: 'Đã lên lịch',
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
}

export const sessionStatusVariants = {
  SCHEDULED: 'info',
  OPEN: 'success',
  CLOSED: 'default',
  CANCELLED: 'danger',
}

export const recordStatusLabels = {
  CHECKED_IN: 'Đã check-in',
  VOIDED: 'Đã hủy',
}

export const recordStatusVariants = {
  CHECKED_IN: 'success',
  VOIDED: 'danger',
}

export const methodLabels = {
  QR: 'QR',
  MANUAL: 'Thủ công',
}
