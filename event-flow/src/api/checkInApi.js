import apiClient from './client'
import { normalizePageResponse, unwrapResponse } from './response'

export const checkInApi = {
  attendees: {
    create: async (eventId, payload) => {
      const response = await apiClient.post(`/events/${eventId}/attendees`, payload)
      return unwrapResponse(response)
    },

    list: async (eventId) => {
      const response = await apiClient.get(`/events/${eventId}/attendees`)
      return unwrapResponse(response)
    },

    get: async (eventId, attendeeId) => {
      const response = await apiClient.get(`/events/${eventId}/attendees/${attendeeId}`)
      return unwrapResponse(response)
    },

    update: async (eventId, attendeeId, payload) => {
      const response = await apiClient.put(`/events/${eventId}/attendees/${attendeeId}`, payload)
      return unwrapResponse(response)
    },

    delete: async (eventId, attendeeId) => {
      const response = await apiClient.delete(`/events/${eventId}/attendees/${attendeeId}`)
      return unwrapResponse(response)
    },
  },

  sessions: {
    create: async (eventId, payload) => {
      const response = await apiClient.post(`/events/${eventId}/check-in-sessions`, payload)
      return unwrapResponse(response)
    },

    list: async (eventId) => {
      const response = await apiClient.get(`/events/${eventId}/check-in-sessions`)
      return unwrapResponse(response)
    },

    get: async (eventId, sessionId) => {
      const response = await apiClient.get(`/events/${eventId}/check-in-sessions/${sessionId}`)
      return unwrapResponse(response)
    },

    update: async (eventId, sessionId, payload) => {
      const response = await apiClient.put(`/events/${eventId}/check-in-sessions/${sessionId}`, payload)
      return unwrapResponse(response)
    },

    delete: async (eventId, sessionId) => {
      const response = await apiClient.delete(`/events/${eventId}/check-in-sessions/${sessionId}`)
      return unwrapResponse(response)
    },
  },

  scan: {
    eventToken: async (eventId, token) => {
      const response = await apiClient.post(`/events/${eventId}/check-ins/scan`, { token })
      return unwrapResponse(response)
    },

    sessionQrOrInvite: async (eventId, sessionId, payload) => {
      const response = await apiClient.post(`/events/${eventId}/check-in-sessions/${sessionId}/scan`, payload)
      return unwrapResponse(response)
    },

    manual: async (eventId, sessionId, payload) => {
      const response = await apiClient.post(`/events/${eventId}/check-in-sessions/${sessionId}/manual`, payload)
      return unwrapResponse(response)
    },
  },

  records: {
    listBySession: async (eventId, sessionId) => {
      const response = await apiClient.get(`/events/${eventId}/check-in-sessions/${sessionId}/records`)
      return unwrapResponse(response)
    },
  },

  audit: {
    list: async (eventId, params = {}) => {
      const response = await apiClient.get(`/events/${eventId}/check-ins/audit`, { params })
      return normalizePageResponse(unwrapResponse(response), params.size || 20)
    },
  },

  qr: {
    generateForMember: async (eventId, userEventId) => {
      const response = await apiClient.post(`/events/${eventId}/members/${userEventId}/qr`)
      return unwrapResponse(response)
    },
  },
}
