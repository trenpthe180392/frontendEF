import apiClient from './client'

export const eventApi = {
  getByOrganization: (organizationId) => apiClient.get(`/events/organization/${organizationId}`),
  getById: (eventId) => apiClient.get(`/events/${eventId}`),
  getAccessContext: (eventId) => apiClient.get(`/events/${eventId}/access-context`),
  create: (data) => apiClient.post('/events', data),
  update: (eventId, data) => apiClient.put(`/events/${eventId}`, data),
  updateStatus: (eventId, status) => apiClient.patch(`/events/${eventId}/status`, { status }),
  cancel: (eventId, reason) => apiClient.patch(`/events/${eventId}/cancel`, { reason }),
  delete: (eventId) => apiClient.delete(`/events/${eventId}`),
}
