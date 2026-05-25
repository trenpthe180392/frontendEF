import apiClient from './client'
import { unwrapResponse } from './response'

export const notificationApi = {
  getAll: async () => {
    const response = await apiClient.get('/notifications')
    return unwrapResponse(response)
  },
  markRead: async (id) => {
    const response = await apiClient.patch(`/notifications/${id}/read`)
    return unwrapResponse(response)
  },
  markAllRead: async () => {
    const response = await apiClient.patch('/notifications/read-all')
    return unwrapResponse(response)
  },
}
