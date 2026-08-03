import api from "./api";

// Panggil endpoint auth backend Laravel (AuthController).
export const loginRequest = (email, password) =>
  api.post("/login", { email, password, device_name: "web" });

export const logoutRequest = () => api.post("/logout");

// Pendaftaran akun mandiri. payload: {name,email,password,password_confirmation,role_diminta,jabatan,divisi,perusahaan}
export const registerRequest = (payload) => api.post("/register", payload);

export const meRequest = () => api.get("/me");
