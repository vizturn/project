import api from "./api";

// Panggil endpoint auth backend Laravel (AuthController).
export const loginRequest = (email, password) =>
  api.post("/login", { email, password, device_name: "web" });

export const logoutRequest = () => api.post("/logout");

export const meRequest = () => api.get("/me");
