import apiClient from './client'

export const dashboardApi = {
  getLeaderEvent: (eventId) => apiClient.get(`/dashboard/leader/event/${eventId}`),
  getTeam: (teamId) => apiClient.get(`/dashboard/team/${teamId}`),
}
