export const defaultDepartmentForm = {
  name: '',
  description: '',
  parentDepartmentId: '',
  status: 'ACTIVE',
}

export const defaultDepartmentMemberForm = {
  departmentId: '',
  userId: '',
  role: 'MEMBER',
}

export const departmentStatusVariant = {
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  banned: 'danger',
}
