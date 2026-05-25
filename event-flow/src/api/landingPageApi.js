import apiClient from './client'
import { unwrapResponse } from './response'

export const landingPageApi = {
  get: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/landing-page`)
    return unwrapResponse(response)
  },

  update: async (eventId, payload) => {
    const response = await apiClient.put(`/events/${eventId}/landing-page`, payload)
    return unwrapResponse(response)
  },

  uploadBanner: async (eventId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post(`/events/${eventId}/landing-page/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapResponse(response)
  },

  publish: async (eventId) => {
    const response = await apiClient.post(`/events/${eventId}/landing-page/publish`)
    return unwrapResponse(response)
  },

  unpublish: async (eventId) => {
    const response = await apiClient.post(`/events/${eventId}/landing-page/unpublish`)
    return unwrapResponse(response)
  },
}
