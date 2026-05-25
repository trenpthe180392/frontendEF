import apiClient from './client'
import { unwrapResponse } from './response'

export const subscriptionApi = {
  getPlans: async () => {
    const response = await apiClient.get('/subscriptions/plans')
    return unwrapResponse(response)
  },

  getActiveSubscription: async (organizationId) => {
    const response = await apiClient.get(`/organizations/${organizationId}/subscription`)
    return unwrapResponse(response)
  },

  checkout: async (organizationId, payload) => {
    const response = await apiClient.post(`/organizations/${organizationId}/subscriptions/checkout`, payload)
    return unwrapResponse(response)
  },

  upgrade: async (organizationId, payload) => {
    const response = await apiClient.post(`/organizations/${organizationId}/subscription/upgrade`, payload)
    return unwrapResponse(response)
  },

  cancel: async (organizationId) => {
    const response = await apiClient.post(`/organizations/${organizationId}/subscription/cancel`)
    return unwrapResponse(response)
  },

  resume: async (organizationId) => {
    const response = await apiClient.post(`/organizations/${organizationId}/subscription/resume`)
    return unwrapResponse(response)
  },

  getBillingHistory: async (organizationId) => {
    const response = await apiClient.get(`/organizations/${organizationId}/billing-history`)
    return unwrapResponse(response)
  },
}
