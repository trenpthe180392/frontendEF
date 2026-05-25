import apiClient from './client'
import { unwrapResponse } from './response'

export const publicEmailApi = {
  unsubscribeByToken: async (token) => {
    const response = await apiClient.get('/public/email/unsubscribe', { params: { token } })
    return unwrapResponse(response)
  },

  confirmUnsubscribe: async (token) => {
    const response = await apiClient.post('/public/email/unsubscribe', { token })
    return unwrapResponse(response)
  },
}
