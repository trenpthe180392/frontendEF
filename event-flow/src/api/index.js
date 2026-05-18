import apiClient from './client'

// ─── AUTH ──────────────────────────────────────────────────
export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  confirmEmail: (token) => apiClient.get(`/auth/confirm?token=${token}`),
  login: (data) => apiClient.post('/auth/login', data),
}

// ─── EVENTS ───────────────────────────────────────────────
export const eventApi = {
  create: (data) => apiClient.post('/events', data),
  delete: (eventId) => apiClient.delete(`/events/${eventId}`),
  cancel: (eventId) => apiClient.patch(`/events/${eventId}/cancel`),
}

// ─── EVENT MEMBERS ────────────────────────────────────────
export const eventMemberApi = {
  add: (data) => apiClient.post('/event-members', data),
}

// ─── TEAMS ────────────────────────────────────────────────
export const teamApi = {
  create: (data) => apiClient.post('/teams', data),
  getById: (id) => apiClient.get(`/teams/${id}`),
  getByEvent: (eventId) => apiClient.get(`/teams/event/${eventId}`),
  getByOrganization: (orgId) => apiClient.get(`/teams/organization/${orgId}`),
}

// ─── TEAM MEMBERS ─────────────────────────────────────────
export const teamMemberApi = {
  add: (data) => apiClient.post('/team-members', data),
  getByTeam: (teamId) => apiClient.get(`/team-members/${teamId}`),
  remove: (teamId, userId) => apiClient.delete(`/team-members/${teamId}/users/${userId}`),
  updateRole: (teamId, userId, data) => apiClient.put(`/team-members/${teamId}/users/${userId}/role`, data),
}

// ─── TASKS ────────────────────────────────────────────────
export const taskApi = {
  create: (data) => apiClient.post('/tasks', data),
  getById: (id) => apiClient.get(`/tasks/${id}`),
  getByEvent: (eventId) => apiClient.get(`/tasks/event/${eventId}`),
  getByTeam: (teamId) => apiClient.get(`/tasks/team/${teamId}`),
  getSubtasks: (id) => apiClient.get(`/tasks/${id}/subtasks`),
  assignUser: (taskId, data) => apiClient.patch(`/tasks/${taskId}/assignee`, data),
  assignTeam: (taskId, data) => apiClient.patch(`/tasks/${taskId}/team`, data),
  update: (id, data) => apiClient.put(`/tasks/${id}`, data),
  reassignUser: (taskId, userId) => apiClient.put(`/tasks/${taskId}/reassign-user/${userId}`),
  reassignTeam: (taskId, teamId) => apiClient.put(`/tasks/${taskId}/reassign-team/${teamId}`),
  unassign: (taskId) => apiClient.delete(`/tasks/${taskId}/unassign`),
  delete: (taskId) => apiClient.delete(`/tasks/${taskId}`),
}

// ─── CALENDAR ─────────────────────────────────────────────
export const calendarApi = {
  createEventCalendar: (eventId, data) => apiClient.post(`/calendars/event/${eventId}`, data),
  createTeamCalendar: (teamId, data) => apiClient.post(`/calendars/team/${teamId}`, data),
  updateEventCalendar: (eventId, calId, data) => apiClient.put(`/calendars/event/${eventId}/calendar/${calId}`, data),
  updateTeamCalendar: (teamId, calId, data) => apiClient.put(`/calendars/team/${teamId}/calendar/${calId}`, data),
  getBTCCalendar: (eventId) => apiClient.get(`/calendars/event/${eventId}/btc`),
  getTeamCalendar: (teamId) => apiClient.get(`/calendars/team/${teamId}`),
  getEventCalendarDetail: (eventId, calId) => apiClient.get(`/calendars/event/${eventId}/calendar/${calId}`),
  getTeamCalendarDetail: (teamId, calId) => apiClient.get(`/calendars/team/${teamId}/calendar/${calId}`),
  deleteEventCalendar: (eventId, calId) => apiClient.delete(`/calendars/event/${eventId}/calendar/${calId}`),
  deleteTeamCalendar: (teamId, calId) => apiClient.delete(`/calendars/team/${teamId}/calendar/${calId}`),
}

// ─── DASHBOARD ────────────────────────────────────────────
export const dashboardApi = {
  getLeaderDashboard: (eventId) => apiClient.get(`/dashboard/leader/event/${eventId}`),
  getTeamDashboard: (teamId) => apiClient.get(`/dashboard/team/${teamId}`),
}

// ─── ISSUES ───────────────────────────────────────────────
export const issueApi = {
  create: (data) => apiClient.post('/issues', data),
  getById: (id) => apiClient.get(`/issues/${id}`),
  getByEvent: (eventId) => apiClient.get(`/issues/event/${eventId}`),
  getByTeam: (teamId) => apiClient.get(`/issues/team/${teamId}`),
  updateStatus: (id, data) => apiClient.put(`/issues/${id}/status`, data),
  assign: (id, data) => apiClient.put(`/issues/${id}/assign`, data),
}

// ─── ISSUE PARTICIPANTS ───────────────────────────────────
export const issueParticipantApi = {
  add: (data) => apiClient.post('/issue-participants', data),
  getByIssue: (issueId) => apiClient.get(`/issue-participants/${issueId}`),
  remove: (issueId, userId) => apiClient.delete(`/issue-participants/${issueId}/users/${userId}`),
}

// ─── ORGANIZATIONS ────────────────────────────────────────
export const organizationApi = {
  create: (data) => apiClient.post('/organizations', data),
  getById: (id) => apiClient.get(`/organizations/${id}`),
  getAll: () => apiClient.get('/organizations'),
}

// ─── ORGANIZATION MEMBERS ─────────────────────────────────
export const orgMemberApi = {
  add: (data) => apiClient.post('/organization-members', data),
  getByOrg: (orgId) => apiClient.get(`/organization-members/${orgId}`),
  remove: (orgId, userId) => apiClient.delete(`/organization-members/${orgId}/users/${userId}`),
}

// ─── DEPARTMENTS ──────────────────────────────────────────
export const departmentApi = {
  create: (data) => apiClient.post('/departments', data),
  getAll: () => apiClient.get('/departments'),
  getById: (id) => apiClient.get(`/departments/${id}`),
  getByOrganization: (orgId) => apiClient.get(`/departments/organization/${orgId}`),
}

// ─── DEPARTMENT MEMBERS ───────────────────────────────────
export const departmentMemberApi = {
  add: (data) => apiClient.post('/department-members', data),
  getByDepartment: (deptId) => apiClient.get(`/department-members/${deptId}`),
  remove: (deptId, userId) => apiClient.delete(`/department-members/${deptId}/users/${userId}`),
}

// ─── ATTACHMENTS ──────────────────────────────────────────
export const attachmentApi = {
  upload: (file, taskId) => {
    const form = new FormData()
    form.append('file', file)
    form.append('taskId', taskId)
    return apiClient.post('/attachments', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getByTask: (taskId) => apiClient.get(`/attachments?taskId=${taskId}`),
  update: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.put(`/attachments/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  remove: (id) => apiClient.delete(`/attachments/${id}`),
}

// ─── FEEDBACK ─────────────────────────────────────────────
export const feedbackApi = {
  submitForTask: (data) => apiClient.post('/feedback/task', data),
}

// ─── AI ───────────────────────────────────────────────────
export const aiApi = {
  suggestTeams: (eventId) => apiClient.get(`/ai/suggest-teams/${eventId}`),
  suggestTasks: (eventId) => apiClient.get(`/ai/suggest-tasks/${eventId}`),
  suggestCalendar: (eventId) => apiClient.get(`/ai/suggest-calendar/${eventId}`),
}
