import apiClient from './client'

export const attachmentApi = {
  getByTask: (taskId) => apiClient.get('/attachments', { params: { taskId } }),
  upload: (taskId, file) => {
    const formData = new FormData()
    formData.append('taskId', taskId)
    formData.append('file', file)
    return apiClient.post('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  updateFile: (attachmentId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.put(`/attachments/${attachmentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (attachmentId) => apiClient.delete(`/attachments/${attachmentId}`),
}
