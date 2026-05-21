export const organizationRoleOptions = ['OWNER', 'ADMIN', 'MEMBER']

export const privilegedOrganizationRoles = new Set(['OWNER', 'ADMIN'])

export const organizationRoleLabels = {
  OWNER: 'Trưởng ban điều hành',
  ADMIN: 'Quản trị nội bộ',
  MEMBER: 'Nhân sự tổ chức',
}

export const organizationRoleDescriptions = {
  OWNER: 'Người chịu trách nhiệm cao nhất của ban điều hành, quyết định cấu trúc tổ chức, quyền truy cập và định hướng vận hành.',
  ADMIN: 'Quản trị nội bộ, quản lý thành viên, lời mời, phòng ban và cấu hình dữ liệu của tổ chức.',
  MEMBER: 'Nhân sự nội bộ của tổ chức, tham gia vào sự kiện/đội nhóm khi được phân quyền cụ thể.',
}
