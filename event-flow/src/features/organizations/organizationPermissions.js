import { organizationRoleOptions } from './organizationRoles'

export function normalizeOrganizationRole(role) {
  const normalizedRole = String(role || 'MEMBER').toUpperCase()
  return organizationRoleOptions.includes(normalizedRole) ? normalizedRole : 'MEMBER'
}

export function getAssignableOrganizationRoles(actorRole) {
  const role = normalizeOrganizationRole(actorRole)
  if (role === 'OWNER') return organizationRoleOptions
  if (role === 'ADMIN') return organizationRoleOptions.filter((option) => option !== 'OWNER')
  return []
}

export function canUpdateOrganizationMemberRole(actorRole, targetRole, nextRole = targetRole, isSelf = false) {
  const role = normalizeOrganizationRole(actorRole)
  const target = normalizeOrganizationRole(targetRole)
  const next = normalizeOrganizationRole(nextRole)

  if (isSelf) return false
  if (role === 'OWNER') return true
  if (role === 'ADMIN') return target !== 'OWNER' && next !== 'OWNER'
  return false
}

export function canRemoveOrganizationMember(actorRole, targetRole, isSelf = false) {
  const role = normalizeOrganizationRole(actorRole)
  const target = normalizeOrganizationRole(targetRole)

  if (isSelf) return false
  if (role === 'OWNER') return true
  if (role === 'ADMIN') return target !== 'OWNER'
  return false
}

export function canManageOrganizationInvitation(actorRole, nextRole = 'MEMBER') {
  const role = normalizeOrganizationRole(actorRole)
  const next = normalizeOrganizationRole(nextRole)

  if (role === 'OWNER') return true
  if (role === 'ADMIN') return next !== 'OWNER'
  return false
}

export function getOrganizationPermissions(actorRole) {
  const role = normalizeOrganizationRole(actorRole)
  const isOwner = role === 'OWNER'
  const isAdmin = role === 'ADMIN'
  const isManager = isOwner || isAdmin

  return {
    role,
    isOwner,
    isAdmin,
    isManager,
    canViewMembers: true,
    canViewInvitations: isManager,
    canInviteMembers: isManager,
    canEditInvitations: isManager,
    canCancelInvitations: isManager,
    canCreateDepartments: isManager,
    canCreateEvents: isManager,
    canManageBranding: isManager,
    canManageSubscription: isManager,
  }
}

export function canAccessOrganizationRoute(permissions, permissionKey) {
  if (!permissionKey) return true
  if (!permissions) return false

  const routePermissions = {
    'organization.members.view': permissions.canViewMembers,
    'organization.departments.view': true,
    'organization.events.view': true,
    'organization.branding.view': permissions.canManageBranding,
    'organization.subscription.view': permissions.canManageSubscription,
  }

  return routePermissions[permissionKey] ?? true
}

export function filterOrganizationRoutes(routes, permissions) {
  return routes.filter((route) => canAccessOrganizationRoute(permissions, route.permission))
}

export function getOrganizationMembersToolbarPolicy(permissions) {
  return {
    canViewInvitations: permissions.canViewInvitations,
    canInviteMembers: permissions.canInviteMembers,
  }
}

export function getOrganizationMemberRowPolicy(permissions, currentMembership, member) {
  const isSelf = Number(currentMembership?.userId) === Number(member?.userId)
  const editableRoles = getAssignableOrganizationRoles(permissions.role).filter((role) =>
    canUpdateOrganizationMemberRole(permissions.role, member?.role, role, isSelf)
  )

  return {
    editableRoles,
    canEditRole: editableRoles.length > 0,
    canRemove: canRemoveOrganizationMember(permissions.role, member?.role, isSelf),
  }
}

export function getOrganizationInvitePolicy(permissions) {
  return {
    assignableRoles: getAssignableOrganizationRoles(permissions.role),
    canInviteMembers: permissions.canInviteMembers,
    canViewInvitations: permissions.canViewInvitations,
  }
}

export function getOrganizationInvitationRowPolicy(permissions, invitation) {
  const editableRoles = String(invitation?.status || '').toLowerCase() === 'pending'
    ? getAssignableOrganizationRoles(permissions.role).filter((role) =>
        canManageOrganizationInvitation(permissions.role, role)
      )
    : []

  return {
    editableRoles,
    canEdit: permissions.canEditInvitations && editableRoles.length > 0,
    canCancel: permissions.canCancelInvitations && canManageOrganizationInvitation(permissions.role, invitation?.role),
  }
}

export function getOrganizationDepartmentPolicy(permissions) {
  return {
    canManageDepartments: permissions.canCreateDepartments,
  }
}

export function getOrganizationEventPolicy(permissions) {
  return {
    canManageEvents: permissions.canCreateEvents,
  }
}

export function getOrganizationBrandingPolicy(permissions) {
  return {
    canManageBranding: permissions.canManageBranding,
  }
}

export function getOrganizationSubscriptionPolicy(permissions) {
  return {
    canManageSubscription: permissions.canManageSubscription,
  }
}
