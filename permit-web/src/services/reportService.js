import api from "./api";

// filter: { tanggal_mulai, tanggal_selesai, user_id, aksi } — semua opsional
export const getAuditLogs = (filter = {}) => api.get("/audit-logs", { params: filter });

// Export audit log ke CSV (download file). Mengembalikan blob.
export const exportAuditLogs = (filter = {}) =>
  api.get("/audit-logs/export", { params: filter, responseType: "blob" });

/** Statistik personal per peran untuk pengguna yang login. */
export const getMySummary = () => api.get("/dashboard/my-summary");

export const getSummary = (from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return api.get("/reports/summary", { params });
};

// filter: { tanggal_mulai, tanggal_selesai } — default hari ini bila kosong (lihat backend)
export const getPermitLogs = (filter = {}) => api.get("/permit-logs", { params: filter });

// Export log izin harian ke CSV (download file). Mengembalikan blob.
export const exportPermitLogs = (filter = {}) =>
  api.get("/permit-logs/export", { params: filter, responseType: "blob" });
