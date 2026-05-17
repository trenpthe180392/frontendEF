import axiosClient from './axiosClient';

const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  register: (data) => axiosClient.post('/auth/register', data),
  getProfile: () => axiosClient.get('/auth/me'),
};

export default authApi;