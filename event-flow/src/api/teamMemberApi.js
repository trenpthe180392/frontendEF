import apiClient from './client'

export const teamMemberApi = {
  getByTeam: (teamId, params) => apiClient.get(`/team-members/${teamId}`, { params }),
  add: (data) => apiClient.post('/team-members', data),
  remove: (teamId, userId) => apiClient.delete(`/team-members/${teamId}/users/${userId}`),
  updateRole: (teamId, userId, data) => apiClient.put(`/team-members/${teamId}/users/${userId}/role`, data),
}
