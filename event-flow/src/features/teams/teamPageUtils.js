export const teamMemberRoleOptions = ['TEAM_LEADER', 'SUB_TEAM_LEADER', 'MEMBER']

export const teamMemberRoleLabels = {
  TEAM_LEADER: 'Trưởng đội',
  SUB_TEAM_LEADER: 'Phó đội',
  MEMBER: 'Thành viên',
  OWNER: 'Trưởng đội',
  ADMIN: 'Phó đội',
  MANAGER: 'Phó đội',
}

export function normalizeTeamMember(member) {
  return {
    userTeamId: member.userTeamId,
    userId: member.userId,
    userName: member.userName || `Người dùng ${member.userId}`,
    teamId: member.teamId,
    teamName: member.teamName || '',
    role: member.role || 'MEMBER',
    status: String(member.status || 'ACTIVE').toLowerCase(),
    joinedAt: member.joinedAt,
  }
}
