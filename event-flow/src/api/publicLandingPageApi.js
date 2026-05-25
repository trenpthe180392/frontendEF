import apiClient from './client'
import { unwrapResponse } from './response'

export const publicLandingPageApi = {
  getBySlug: async (slug) => {
    const response = await apiClient.get(`/public/events/${slug}`)
    return unwrapResponse(response)
  },

  register: async (slug, payload) => {
    const response = await apiClient.post(`/public/events/${slug}/registrations`, payload)
    return unwrapResponse(response)
  },
}
