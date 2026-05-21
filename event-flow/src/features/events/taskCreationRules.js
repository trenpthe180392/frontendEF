export function canCreateTaskForEvent(eventDetail) {
  if (!eventDetail) return false
  if (eventDetail.status !== 'ongoing') return false

  const now = new Date()
  const start = eventDetail.startTime ? new Date(eventDetail.startTime) : null
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

export function getTaskCreationBlockedMessage(eventDetail) {
  if (!eventDetail) return 'Không xác định được thông tin sự kiện.'
  if (eventDetail.status !== 'ongoing') return 'Công việc chỉ được tạo khi sự kiện ở trạng thái Đang diễn ra.'

  const now = new Date()
  const start = eventDetail.startTime ? new Date(eventDetail.startTime) : null
  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : null

  if (start && now < start) return 'Chưa đến thời gian bắt đầu sự kiện.'
  if (end && now > end) return 'Sự kiện đã kết thúc.'
  return 'Công việc chỉ được tạo trong khoảng thời gian diễn ra sự kiện.'
}

export function validateTaskDueTime(eventDetail, dueTimeValue) {
  const dueTime = new Date(dueTimeValue)
  if (Number.isNaN(dueTime.getTime())) return 'Hạn hoàn thành không hợp lệ'

  const now = new Date()
  if (dueTime < now) return 'Hạn hoàn thành không được trước thời điểm hiện tại'

  const start = eventDetail?.startTime ? new Date(eventDetail.startTime) : null
  const end = eventDetail?.endTime ? new Date(eventDetail.endTime) : null

  if (start && dueTime < start) return 'Hạn hoàn thành không được trước thời gian bắt đầu sự kiện'
  if (end && dueTime > end) return 'Hạn hoàn thành không được sau thời gian kết thúc sự kiện'
  return null
}
