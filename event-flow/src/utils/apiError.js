export function getErrorMessage(error, fallback = 'Đã có lỗi xảy ra') {
  const data = error?.response?.data
  const status = error?.response?.status
  const fields = data?.fields

  if (!error?.response && (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error')) {
    return 'Không kết nối được tới máy chủ. Vui lòng kiểm tra backend đang chạy rồi thử lại.'
  }

  if (!error?.response && error?.code === 'ECONNABORTED') {
    return 'AI phản hồi quá lâu. Vui lòng thử lại với ngữ cảnh ngắn hơn hoặc thử lại sau.'
  }

  if (
    fields &&
    typeof fields === 'object' &&
    !Array.isArray(fields) &&
    Object.keys(fields).length > 0 &&
    (!data?.message || data.message === 'Invalid request data')
  ) {
    return Object.values(fields).filter(Boolean).join('. ')
  }

  // 1. Priority: error.response.data.message
  if (data?.message) {
    const budgetMatch = String(data.message).match(/Budget exceeded:\s*requested=([^,]+),\s*remaining=([^\s]+)/i)
    if (budgetMatch) {
      return `Ngân sách không đủ: yêu cầu ${budgetMatch[1]}, còn lại ${budgetMatch[2]}.`
    }
    return data.message
  }

  // 2. Priority: error.response.data.errorCode
  if (data?.errorCode) {
    return data.errorCode
  }

  // Special handling for common HTTP status codes
  if (status === 401) {
    return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
  }

  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này'
  }

  // 3. Priority: error.message
  if (error?.message) {
    const budgetMatch = String(error.message).match(/Budget exceeded:\s*requested=([^,]+),\s*remaining=([^\s]+)/i)
    if (budgetMatch) {
      return `Ngân sách không đủ: yêu cầu ${budgetMatch[1]}, còn lại ${budgetMatch[2]}.`
    }
    return error.message
  }

  // 4. Fallback
  return fallback
}

export function getFieldErrors(error) {
  const fields = error?.response?.data?.fields
  if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
    return fields
  }
  return {}
}
