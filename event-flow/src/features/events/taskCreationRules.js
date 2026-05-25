export function canCreateTaskForEvent(eventDetail) {
  if (!eventDetail) return false
  if (!['draft', 'published', 'ongoing'].includes(String(eventDetail.status || '').toLowerCase())) return false

  const now = new Date()
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (end && now > end) return false
  return true
}

export function getTaskCreationBlockedMessage(eventDetail) {
  if (!eventDetail) return 'Không xác định được thông tin sự kiện.'
  if (!['draft', 'published', 'ongoing'].includes(String(eventDetail.status || '').toLowerCase())) {
    return 'Không thể tạo công việc khi sự kiện đã hoàn tất, đã hủy hoặc đã xóa.'
  }

  const now = new Date()
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (end && now > end) return 'Sự kiện đã kết thúc.'
  return 'Không thể tạo công việc cho sự kiện này.'
}

export function validateTaskDueTime(eventDetail, dueTimeValue) {
  const dueTime = new Date(dueTimeValue)
  if (Number.isNaN(dueTime.getTime())) return 'Hạn hoàn thành không hợp lệ'

  const now = new Date()
  if (dueTime < now) return 'Hạn hoàn thành không được trước thời điểm hiện tại'

  const end = eventDetail?.endTime ? new Date(eventDetail.endTime) : null

  if (end && dueTime > end) return 'Hạn hoàn thành không được sau thời gian kết thúc sự kiện'
  return null
}
