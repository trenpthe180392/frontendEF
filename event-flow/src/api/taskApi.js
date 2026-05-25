import apiClient from './client'

export const taskApi = {
  getById: (taskId) => apiClient.get(`/tasks/${taskId}`),
  getByEvent: (eventId, params) => apiClient.get(`/tasks/event/${eventId}`, { params }),
  getByTeam: (teamId, params) => apiClient.get(`/tasks/team/${teamId}`, { params }),
  getSubtasks: (taskId) => apiClient.get(`/tasks/${taskId}/subtasks`),
  create: (data) => apiClient.post('/tasks', data),
  update: (taskId, data) => apiClient.put(`/tasks/${taskId}`, data),
  assignUser: (taskId, userId) => apiClient.patch(`/tasks/${taskId}/assignee`, { userId }),
  reassignUser: (taskId, userId) => apiClient.put(`/tasks/${taskId}/reassign-user/${userId}`),
  assignTeam: (taskId, teamId) => apiClient.patch(`/tasks/${taskId}/team`, { teamId }),
  reassignTeam: (taskId, teamId) => apiClient.put(`/tasks/${taskId}/reassign-team/${teamId}`),
  unassign: (taskId) => apiClient.delete(`/tasks/${taskId}/unassign`),
  delete: (taskId) => apiClient.delete(`/tasks/${taskId}`),
}
