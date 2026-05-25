import apiClient from './client'

export const organizationBrandingApi = {
  get: (organizationId) => apiClient.get(`/organizations/${organizationId}/branding`),
  uploadLogo: (organizationId, file) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post(`/organizations/${organizationId}/branding/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteLogo: (organizationId) => apiClient.delete(`/organizations/${organizationId}/branding/logo`),
}
