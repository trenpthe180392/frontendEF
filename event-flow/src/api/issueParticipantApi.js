import apiClient from './client'
import { unwrapResponse } from './response'

export const issueParticipantApi = {
  add: async (payload) => {
    const response = await apiClient.post('/issue-participants', payload)
    return unwrapResponse(response)
  },

  getByIssue: async (issueId) => {
    const response = await apiClient.get(`/issue-participants/${issueId}`)
    return unwrapResponse(response)
  },

  remove: async (issueId, userId) => {
    const response = await apiClient.delete(`/issue-participants/${issueId}/users/${userId}`)
    return unwrapResponse(response)
  },
}
