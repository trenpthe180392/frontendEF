export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function getErrorMessage(error) {
  const status = error?.response?.status
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data?.message) {
    return data.message
  }

  if (data?.error) {
    return data.error
  }

  if (status === 401) {
    return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
  }

  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này'
  }

  return error?.message || 'Đã có lỗi xảy ra'
}
