export const eventRoleOptions = ['OWNER', 'LEADER', 'TEAM_LEADER', 'MEMBER']

export const taskPriorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export const taskStatusOptions = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']

export const teamRoleOptions = ['TEAM_LEADER', 'SUB_TEAM_LEADER', 'MEMBER']

export const eventRoleLabels = {
  OWNER: 'Chủ sự kiện',
  LEADER: 'Trưởng sự kiện',
  TEAM_LEADER: 'Trưởng đội',
  MEMBER: 'Thành viên',
  HOST: 'Chủ sự kiện',
  ORGANIZER: 'Trưởng sự kiện',
  STAFF: 'Thành viên',
  CHECKER: 'Thành viên',
  ATTENDEE: 'Thành viên',
  ORG_ADMIN: 'Chủ sự kiện',
  FINANCE_MANAGER: 'Trưởng tài chính',
  FINANCE_EXECUTOR: 'Phụ trách tài chính đội',
}

export const teamRoleLabels = {
  TEAM_LEADER: 'Trưởng đội',
  SUB_TEAM_LEADER: 'Phó đội',
  MEMBER: 'Thành viên',
  OWNER: 'Trưởng đội',
  ADMIN: 'Phó đội',
  MANAGER: 'Phó đội',
}

export function normalizeEventMember(member) {
  return {
    userEventId: member.userEventId,
    userId: member.userId,
    userName: member.userName || `Người dùng ${member.userId}`,
    role: member.role || 'MEMBER',
    status: String(member.status || 'ACTIVE').toLowerCase(),
    createAt: member.createAt,
  }
}

export function toDateTimeLocalValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

export function toApiDateTime(value) {
  return value || null
}

export function createTaskFormFromTask(task) {
  return {
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'MEDIUM',
    status: task?.status || 'TODO',
    dueTime: toDateTimeLocalValue(task?.dueTime),
    teamId: task?.teamId || task?.assignedTeamId ? String(task.teamId || task.assignedTeamId) : '',
    assigneeId: task?.assigneeId || task?.assignedToUserId ? String(task.assigneeId || task.assignedToUserId) : '',
    progress: task?.progress != null ? String(task.progress) : '0',
  }
}
