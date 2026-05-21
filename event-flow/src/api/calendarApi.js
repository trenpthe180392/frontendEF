import apiClient from './client'

export const calendarApi = {
  getByEvent: (eventId) => apiClient.get(`/calendars/event/${eventId}/btc`),
  getEventCalendarDetail: (eventId, calendarId) => apiClient.get(`/calendars/event/${eventId}/calendar/${calendarId}`),
  createForEvent: (eventId, data) => apiClient.post(`/calendars/event/${eventId}`, data),
  updateForEvent: (eventId, calendarId, data) => apiClient.put(`/calendars/event/${eventId}/calendar/${calendarId}`, data),
  deleteForEvent: (eventId, calendarId) => apiClient.delete(`/calendars/event/${eventId}/calendar/${calendarId}`),
  getByTeam: (teamId) => apiClient.get(`/calendars/team/${teamId}`),
  getTeamCalendarDetail: (teamId, calendarId) => apiClient.get(`/calendars/team/${teamId}/calendar/${calendarId}`),
  createForTeam: (teamId, data) => apiClient.post(`/calendars/team/${teamId}`, data),
  updateForTeam: (teamId, calendarId, data) => apiClient.put(`/calendars/team/${teamId}/calendar/${calendarId}`, data),
  deleteForTeam: (teamId, calendarId) => apiClient.delete(`/calendars/team/${teamId}/calendar/${calendarId}`),
}
