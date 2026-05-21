import apiClient from './client'

export const eventMemberApi = {
  getByEvent: (eventId, params) => apiClient.get(`/event-members/event/${eventId}`, { params }),
  add: (data) => apiClient.post('/event-members', data),
  remove: (eventId, userId) => apiClient.delete(`/event-members/${eventId}/users/${userId}`),
}
