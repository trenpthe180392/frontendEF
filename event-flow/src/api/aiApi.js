import apiClient from './client'

export const aiApi = {
  suggestTeams: (eventId) => apiClient.get(`/ai/suggest-teams/${eventId}`),
  suggestTasks: (eventId) => apiClient.get(`/ai/suggest-tasks/${eventId}`),
  suggestCalendar: (eventId) => apiClient.get(`/ai/suggest-calendar/${eventId}`),
  createSubtasksFromParent: (parentTaskId, data = {}) =>
    apiClient.post(`/ai/tasks/${parentTaskId}/subtasks`, data, { timeout: 60000 }),
}
