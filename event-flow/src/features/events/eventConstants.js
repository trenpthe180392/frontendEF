export const defaultEventForm = {
  name: '',
  description: '',
  eventType: 'Conference',
  location: '',
  startTime: '',
  endTime: '',
  registrationStart: '',
  registrationDeadline: '',
  capacity: '',
  estimatedBudget: '',
  visible: true,
}

export const eventTypeOptions = [
  { value: 'Conference', label: 'Hội nghị' },
  { value: 'Workshop', label: 'Hội thảo thực hành' },
  { value: 'Seminar', label: 'Chuyên đề' },
  { value: 'Competition', label: 'Cuộc thi' },
  { value: 'Networking', label: 'Kết nối' },
  { value: 'Other', label: 'Khác' },
]

export const eventStatusLabels = {
  draft: 'Nháp',
  published: 'Đã công bố',
  ongoing: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  deleted: 'Đã xóa',
}

export function getEventStatusLabel(status) {
  return eventStatusLabels[status] || status
}
