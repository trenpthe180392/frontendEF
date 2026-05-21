import apiClient from './client'

export const aiApi = {
  suggestTeams: (eventId) => apiClient.get(`/ai/suggest-teams/${eventId}`),
  suggestTasks: (eventId) => apiClient.get(`/ai/suggest-tasks/${eventId}`),
  suggestCalendar: (eventId) => apiClient.get(`/ai/suggest-calendar/${eventId}`),
}
