import apiClient from './client'

export const organizationMemberApi = {
  getByOrganization: (organizationId, params) => apiClient.get(`/organization-members/${organizationId}`, { params }),
  getInvitations: (organizationId) =>
    apiClient.get(`/organization-members/invitations/organization/${organizationId}`),
  confirmInvitation: (token) =>
    apiClient.get('/organization-members/invitations/confirm', { params: { token } }),
  add: (data) => apiClient.post('/organization-members', data),
  updateInvitation: (invitationId, data) =>
    apiClient.patch(`/organization-members/invitations/${invitationId}`, data),
  cancelInvitation: (invitationId) => apiClient.delete(`/organization-members/invitations/${invitationId}`),
  updateRole: (organizationId, userId, data) =>
    apiClient.put(`/organization-members/${organizationId}/users/${userId}/role`, data),
  remove: (organizationId, userId) =>
    apiClient.delete(`/organization-members/${organizationId}/users/${userId}`),
}
