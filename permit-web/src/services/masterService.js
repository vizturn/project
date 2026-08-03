import api from "./api";

export const getPermitTypes = () => api.get("/permit-types");
export const getPsbTypes = () => api.get("/psb-types");

// Upload satu file PSB (PDF) ke sebuah izin. Dipakai PA (saat draft) & AA (saat approval).
export const uploadPsbFile = (permitId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/permits/${permitId}/psb-files`, fd);
};

// Hapus satu file PSB.
export const deletePsbFile = (permitId, psbFileId) =>
  api.delete(`/permits/${permitId}/psb-files/${psbFileId}`);

// URL publik file PSB (disk "public").
const PSB_STORAGE_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "") + "/storage/";
export const psbFileUrl = (path) => (path ? PSB_STORAGE_BASE + path : null);
export const getWorkOrders = () => api.get("/work-orders");
export const getEquipment = () => api.get("/equipment");
