import api from "./api";

// Daftar akun. status: "pending" | "aktif" | undefined (semua).
export const getAccounts = (status) =>
  api.get("/accounts", { params: status ? { status } : {} });

// SHE: aktifkan akun & tetapkan role.
export const activateAccount = (userId, role) =>
  api.post(`/accounts/${userId}/activate`, { role });

// SHE: tolak pendaftaran (hapus akun pending).
export const rejectAccount = (userId) =>
  api.post(`/accounts/${userId}/reject`);

// ADM (ICT): nonaktifkan akun.
export const deactivateAccount = (userId) =>
  api.post(`/accounts/${userId}/deactivate`);

// ADM (ICT): aktifkan kembali akun yang dinonaktifkan (role lama dipertahankan).
export const reactivateAccount = (userId) =>
  api.post(`/accounts/${userId}/reactivate`);

// ADM (ICT): hapus permanen (ditolak backend bila punya izin terkait).
export const deleteAccount = (userId) =>
  api.delete(`/accounts/${userId}`);
