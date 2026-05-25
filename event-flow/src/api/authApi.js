import apiClient from './client'

export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  confirm: (token) => apiClient.get('/auth/confirm', { params: { token } }),
  verifyOtp: (data) => apiClient.post('/auth/verify-otp', data),
  resendOtp: (data) => apiClient.post('/auth/resend-otp', data),
}
