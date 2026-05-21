import apiClient from './client'

export const eventApi = {
  getByOrganization: (organizationId) => apiClient.get(`/events/organization/${organizationId}`),
  getById: (eventId) => apiClient.get(`/events/${eventId}`),
  create: (data) => apiClient.post('/events', data),
  update: (eventId, data) => apiClient.put(`/events/${eventId}`, data),
  cancel: (eventId) => apiClient.patch(`/events/${eventId}/cancel`),
  delete: (eventId) => apiClient.delete(`/events/${eventId}`),
}
