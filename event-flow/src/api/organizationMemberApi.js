import apiClient from './client'

export const organizationMemberApi = {
  getByOrganization: (organizationId, params) => apiClient.get(`/organization-members/${organizationId}`, { params }),
  getInvitations: (organizationId) =>
    apiClient.get(`/organization-members/invitations/organization/${organizationId}`),
  add: (data) => apiClient.post('/organization-members', data),
  updateInvitation: (invitationId, data) =>
    apiClient.patch(`/organization-members/invitations/${invitationId}`, data),
  cancelInvitation: (invitationId) => apiClient.delete(`/organization-members/invitations/${invitationId}`),
  remove: (organizationId, userId) =>
    apiClient.delete(`/organization-members/${organizationId}/users/${userId}`),
}
