import apiClient from './client'

export const eventMemberApi = {
  getByEvent: (eventId, params) => apiClient.get(`/event-members/event/${eventId}`, { params }),
  add: (data) => apiClient.post('/event-members', data),
  updateCapabilities: (eventId, userId, capabilities) => apiClient.put(`/event-members/${eventId}/users/${userId}/capabilities`, { capabilities }),
  getOffboardingImpact: (eventId, userId) => apiClient.get(`/event-members/${eventId}/users/${userId}/offboarding-impact`),
  remove: (eventId, userId) => apiClient.delete(`/event-members/${eventId}/users/${userId}`),
}
