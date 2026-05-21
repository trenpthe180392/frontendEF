import apiClient from './client'

export const teamApi = {
  getById: (teamId) => apiClient.get(`/teams/${teamId}`),
  getByEvent: (eventId, params) => apiClient.get(`/teams/event/${eventId}`, { params }),
  create: (data) => apiClient.post('/teams', data),
  delete: (teamId) => apiClient.delete(`/teams/${teamId}`),
}
