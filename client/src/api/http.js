import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";
const STORAGE_KEY = "campus_connect_token";

export const tokenStorageKey = STORAGE_KEY;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
