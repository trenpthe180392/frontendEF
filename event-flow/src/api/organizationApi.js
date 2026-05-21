import apiClient from './client'

export const organizationApi = {
  getAll: () => apiClient.get('/organizations'),
  getById: (id) => apiClient.get(`/organizations/${id}`),
  create: (data) => apiClient.post('/organizations', data),
}
