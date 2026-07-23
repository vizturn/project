import api from "./api";

// Bagian 3 (bagian IA, khusus CSE) — keputusan Isolasi Energi + (opsional) Sertifikat Isolasi.
// formData: cse_isolasi_diperlukan ("1"/"0"), cse_isolasi_cert_nomor?, cse_isolasi_cert_file?
export const storeCseIsolation = (id, formData) =>
  api.post(`/permits/${id}/cse-isolation`, formData);

// Bagian 3 (Persiapan, khusus CSE) — PA menetapkan Petugas Jaga & peralatan khusus.
// payload: { cse_petugas_jaga_id, cse_alat_komunikasi?, peralatan[], peralatan_lainnya? }
export const storeCsePreparation = (id, payload) =>
  api.post(`/permits/${id}/cse-preparation`, payload);

// Bagian 7 (khusus CSE) — catatan keluar-masuk ruang terbatas oleh Petugas Jaga.
export const getCseAccessLogs = (id) => api.get(`/permits/${id}/cse-access-logs`);
export const addCseAccessLog = (id, payload) =>
  api.post(`/permits/${id}/cse-access-logs`, payload);

// URL file publik (disk "public" + `php artisan storage:link`) untuk Sertifikat Isolasi CSE.
const STORAGE_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "") + "/storage/";
export const cseFileUrl = (path) => (path ? STORAGE_BASE_URL + path : null);
