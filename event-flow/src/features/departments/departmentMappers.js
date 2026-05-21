export function normalizeDepartment(department) {
  return {
    id: department.id,
    name: department.name || '',
    description: department.description || '',
    status: String(department.status || 'ACTIVE').toLowerCase(),
    organizationId: department.organizationId,
    organizationName: department.organizationName || '',
    parentDepartmentId: department.parentDepartmentId,
    parentDepartmentName: department.parentDepartmentName || '',
    childrenCount: Number(department.childrenCount || 0),
    memberCount: Number(department.memberCount || 0),
    createAt: department.createAt,
    updateAt: department.updateAt,
    message: department.message || '',
  }
}

export function normalizeDepartmentMember(member) {
  return {
    id: member.userDepartmentId || `${member.departmentId}-${member.userId}`,
    userDepartmentId: member.userDepartmentId,
    userId: member.userId,
    userName: member.userName || `Người dùng ${member.userId}`,
    departmentId: member.departmentId,
    departmentName: member.departmentName || '',
    organizationId: member.organizationId,
    organizationName: member.organizationName || '',
    role: member.role || 'MEMBER',
    status: String(member.status || 'ACTIVE').toLowerCase(),
    joinedAt: member.joinedAt,
    message: member.message || '',
  }
}
