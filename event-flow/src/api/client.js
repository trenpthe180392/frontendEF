import axios from "axios";
import { getToken, clearToken } from "./tokenService";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===============================
   REQUEST INTERCEPTOR
================================ */
apiClient.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ===============================
   RESPONSE INTERCEPTOR
================================ */
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default apiClient;