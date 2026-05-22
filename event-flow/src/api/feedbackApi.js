import apiClient from './client'

export const feedbackApi = {
  createForTask: (data) => apiClient.post('/feedback/task', data),
}
