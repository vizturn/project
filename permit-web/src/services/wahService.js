import api from "./api";

// Bagian 3 (bagian IA, khusus WAH) — keputusan Isolasi Energi + (opsional) Sertifikat Isolasi.
// formData: FormData berisi wah_isolasi_diperlukan ("1"/"0"), wah_isolasi_cert_nomor?, wah_isolasi_cert_file?
export const storeWahIsolation = (id, formData) =>
  api.post(`/permits/${id}/wah-isolation`, formData);

// Bagian 3 (Persiapan, khusus WAH) — PA upload JSA & (opsional) Scaffolding Certificate.
// formData: FormData berisi nomor_jsa, jsa_file, wah_menggunakan_perancah,
// wah_scaffolding_cert_nomor?, wah_scaffolding_cert_file?
// Catatan: JANGAN set header Content-Type manual — axios otomatis memakai
// multipart/form-data + boundary yang benar saat body berupa FormData.
export const storeWahPreparation = (id, formData) =>
  api.post(`/permits/${id}/wah-preparation`, formData);

// URL file publik (disk "public" + `php artisan storage:link`) untuk file JSA / Scaffolding
// Certificate yang sudah diunggah. Dipakai langsung sebagai href — tidak butuh token,
// jadi bisa dibuka lewat <a> biasa.
const STORAGE_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "") + "/storage/";
export const wahFileUrl = (path) => (path ? STORAGE_BASE_URL + path : null);

// Bagian 7 (khusus WAH) — riwayat naik/turun PA, boleh dicatat berkali-kali selama izin AKTIF.
export const getWahAccessLogs = (id) => api.get(`/permits/${id}/wah-access-logs`);
export const addWahAccessLog = (id, payload) =>
  api.post(`/permits/${id}/wah-access-logs`, payload);
