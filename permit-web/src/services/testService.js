import api from "./api";

// Service sementara untuk menguji koneksi ke backend
export const pingBackend = () => api.get("/ping");
