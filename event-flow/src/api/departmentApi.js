import apiClient from './client'

export const departmentApi = {
  getAll: () => apiClient.get('/departments'),
  getById: (id) => apiClient.get(`/departments/${id}`),
  getByOrganization: (organizationId) => apiClient.get(`/departments/organization/${organizationId}`),
  create: (data) => apiClient.post('/departments', data),
}
