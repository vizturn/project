import api from "./api";

// Bagian 3 (bagian IA, khusus CSE) — keputusan Isolasi Energi + (opsional) Sertifikat Isolasi.
// formData: cse_isolasi_diperlukan ("1"/"0"), cse_isolasi_cert_nomor?, cse_isolasi_cert_file?
export const storeCseIsolation = (id, formData) =>
  api.post(`/permits/${id}/cse-isolation`, formData);

// Bagian 3 (Persiapan, khusus CSE) — PA menetapkan Petugas Jaga & peralatan khusus.
// payload: { cse_petugas_jaga_nama, cse_alat_komunikasi?, nomor_jsa?, jsa_file?, peralatan[], peralatan_lainnya? }
export const storeCsePreparation = (id, payload) => {
  const fd = new FormData();
  fd.append("cse_petugas_jaga_nama", payload.cse_petugas_jaga_nama);
  if (payload.cse_alat_komunikasi) fd.append("cse_alat_komunikasi", payload.cse_alat_komunikasi);
  if (payload.nomor_jsa) fd.append("nomor_jsa", payload.nomor_jsa);
  if (payload.jsa_file) fd.append("jsa_file", payload.jsa_file);
  (payload.peralatan || []).forEach((p, i) => fd.append(`peralatan[${i}]`, p));
  if (payload.peralatan_lainnya) fd.append("peralatan_lainnya", payload.peralatan_lainnya);
  return api.post(`/permits/${id}/cse-preparation`, fd);
};

// Bagian 7 (khusus CSE) — catatan keluar-masuk ruang terbatas oleh Petugas Jaga.
export const getCseAccessLogs = (id) => api.get(`/permits/${id}/cse-access-logs`);
export const addCseAccessLog = (id, payload) =>
  api.post(`/permits/${id}/cse-access-logs`, payload);

// URL file publik (disk "public" + `php artisan storage:link`) untuk Sertifikat Isolasi CSE.
const STORAGE_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "") + "/storage/";
export const cseFileUrl = (path) => (path ? STORAGE_BASE_URL + path : null);
