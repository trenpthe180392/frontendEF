import apiClient from './client'
import { unwrapResponse } from './response'

export const issueApi = {
  create: async (payload) => {
    const response = await apiClient.post('/issues', payload)
    return unwrapResponse(response)
  },

  getById: async (issueId) => {
    const response = await apiClient.get(`/issues/${issueId}`)
    return unwrapResponse(response)
  },

  getByEvent: async (eventId) => {
    const response = await apiClient.get(`/issues/event/${eventId}`)
    return unwrapResponse(response)
  },

  getByTeam: async (teamId) => {
    const response = await apiClient.get(`/issues/team/${teamId}`)
    return unwrapResponse(response)
  },

  updateStatus: async (issueId, payload) => {
    const response = await apiClient.put(`/issues/${issueId}/status`, payload)
    return unwrapResponse(response)
  },

  assign: async (issueId, userId) => {
    const response = await apiClient.put(`/issues/${issueId}/assign`, { userId })
    return unwrapResponse(response)
  },
}
