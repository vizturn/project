import axios from "axios";

// Instance Axios terpusat untuk semua request ke Laravel API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:8000/api
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Lampirkan token Sanctum otomatis (jika ada)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tangani error umum (mis. token kadaluarsa)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;
