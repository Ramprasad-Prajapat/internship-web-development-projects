import axios from "axios";

/**
 * Central HTTP client for the future Spring Boot backend.
 *
 * NOTE: This is NOT used yet. The app currently runs on mock data
 * (see src/services/mockLearningService.ts). This file is kept ready so
 * that when the real backend exists, we only switch the service files
 * from mock calls to `api.get(...)` / `api.post(...)` here.
 *
 * The JWT token is read from localStorage and attached automatically.
 * Never put API keys or secrets in this file — only the base URL.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
