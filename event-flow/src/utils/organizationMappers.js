export function normalizeOrganization(organization) {
  return {
    id: organization.id,
    organizationName: organization.organizationName || '',
    description: organization.description || '',
    type: organization.type || 'OTHER',
    logoUrl: organization.logoUrl || '',
    phone: organization.phone || '',
    email: organization.email || '',
    status: String(organization.status || 'ACTIVE').toLowerCase(),
    createdByUserId: organization.createdByUserId,
    createdByUserName: organization.createdByUserName || 'Chủ sở hữu',
    memberCount: Number(organization.memberCount || 0),
    departmentCount: Number(organization.departmentCount || 0),
    createAt: organization.createAt,
    updateAt: organization.updateAt,
    message: organization.message || '',
  }
}

export function normalizeOrganizationMember(member) {
  return {
    id: member.userOrganizationId || `${member.organizationId}-${member.userId}`,
    userOrganizationId: member.userOrganizationId,
    userId: member.userId,
    userName: member.userName || `Người dùng ${member.userId}`,
    organizationId: member.organizationId,
    organizationName: member.organizationName || '',
    role: member.role || 'MEMBER',
    status: String(member.status || 'ACTIVE').toLowerCase(),
    joinedAt: member.joinedAt,
    message: member.message || '',
  }
}

export function normalizeOrganizationInvitation(invitation) {
  return {
    id: invitation.invitationId,
    invitationId: invitation.invitationId,
    email: invitation.email || '',
    invitedUserId: invitation.invitedUserId,
    invitedUserName: invitation.invitedUserName || '',
    organizationId: invitation.organizationId,
    organizationName: invitation.organizationName || '',
    role: invitation.role || 'MEMBER',
    status: String(invitation.status || 'PENDING').toLowerCase(),
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    createdAt: invitation.createdAt,
    invitedByUserId: invitation.invitedByUserId,
    invitedByUserName: invitation.invitedByUserName || '',
    message: invitation.message || '',
  }
}

export function normalizeOrganizationEvent(event) {
  return {
    id: event.eventId,
    eventId: event.eventId,
    name: event.name || '',
    description: event.description || '',
    eventType: event.eventType || '',
    status: String(event.status || 'DRAFT').toLowerCase(),
    location: event.location || '',
    startTime: event.startTime,
    endTime: event.endTime,
    registrationStart: event.registrationStart,
    registrationDeadline: event.registrationDeadline,
    capacity: event.capacity,
    estimatedBudget: event.estimatedBudget,
    approvedBudget: event.approvedBudget,
    visible: event.visible !== false,
    organizationId: event.organizationId,
    organizationName: event.organizationName || '',
    createdByUserId: event.createdByUserId,
    createdByUserName: event.createdByUserName || '',
    createAt: event.createAt,
    updateAt: event.updateAt,
  }
}
