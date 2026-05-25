import apiClient from './client'
import { unwrapResponse, normalizePageResponse } from './response'

export const emailCampaignApi = {
  /**
   * Create a new email campaign
   * POST /events/{eventId}/email-campaigns
   */
  create: async (eventId, campaignData) => {
    const response = await apiClient.post(`/events/${eventId}/email-campaigns`, campaignData)
    return unwrapResponse(response)
  },

  generateContent: async (eventId, data) => {
    const response = await apiClient.post(`/events/${eventId}/email-campaigns/generate-content`, data)
    return unwrapResponse(response)
  },

  /**
   * Schedule a campaign to be sent at a specific time
   * POST /events/{eventId}/email-campaigns/{campaignId}/schedule
   */
  schedule: async (eventId, campaignId, scheduleData) => {
    const response = await apiClient.post(`/events/${eventId}/email-campaigns/${campaignId}/schedule`, scheduleData)
    return unwrapResponse(response)
  },

  /**
   * Send a campaign immediately
   * POST /events/{eventId}/email-campaigns/{campaignId}/send-now
   */
  sendNow: async (eventId, campaignId) => {
    const response = await apiClient.post(`/events/${eventId}/email-campaigns/${campaignId}/send-now`)
    return unwrapResponse(response)
  },

  /**
   * Get list of email campaigns for an event
   * GET /events/{eventId}/email-campaigns
   */
  getList: async (eventId, params = {}) => {
    const response = await apiClient.get(`/events/${eventId}/email-campaigns`, { params })
    const data = unwrapResponse(response)
    return normalizePageResponse(data)
  },

  /**
   * Get delivery logs for a specific campaign
   * GET /events/{eventId}/email-campaigns/{campaignId}/logs
   */
  getLogs: async (eventId, campaignId, params = {}) => {
    const response = await apiClient.get(`/events/${eventId}/email-campaigns/${campaignId}/logs`, { params })
    const data = unwrapResponse(response)
    return normalizePageResponse(data)
  }
}
