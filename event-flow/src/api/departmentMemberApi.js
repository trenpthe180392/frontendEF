import apiClient from './client'

export const departmentMemberApi = {
  getByDepartment: (departmentId) => apiClient.get(`/department-members/${departmentId}`),
  add: (data) => apiClient.post('/department-members', data),
  remove: (departmentId, userId) =>
    apiClient.delete(`/department-members/${departmentId}/users/${userId}`),
}
