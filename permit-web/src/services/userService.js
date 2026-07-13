import api from "./api";

// Ambil daftar user aktif per kode role (mis. "AA" atau "IA").
export const getUsersByRole = (role) => api.get("/users", { params: { role } });
