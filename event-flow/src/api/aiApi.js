import apiClient from './client'

export const aiApi = {
  suggestTeams: (eventId, data = {}) => apiClient.post(`/ai/suggest-teams/${eventId}`, data, { timeout: 60000 }),
  suggestTasks: (eventId, data = {}) => apiClient.post(`/ai/suggest-tasks/${eventId}`, data, { timeout: 60000 }),
  suggestCalendar: (eventId, data = {}) => apiClient.post(`/ai/suggest-calendar/${eventId}`, data, { timeout: 60000 }),
  createSubtasksFromParent: (parentTaskId, data = {}) =>
    apiClient.post(`/ai/tasks/${parentTaskId}/subtasks`, data, { timeout: 60000 }),
}
