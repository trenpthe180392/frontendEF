import apiClient from './client'

export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  verifyOtp: (data) => apiClient.post('/auth/verify-otp', data),
  resendOtp: (data) => apiClient.post('/auth/resend-otp', data),
}
