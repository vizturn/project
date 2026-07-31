import api from "./api";

// Master daftar bahaya untuk izin ini (dikelompokkan per jenis izin).
export const getHazardOptions = (permitId) =>
  api.get(`/permits/${permitId}/hazard-options`);

// Ubah payload objek menjadi FormData agar bisa menyertakan file JSA.
// Array hazards di-append dengan notasi Laravel (hazards[i][field]) agar
// otomatis ter-parse sebagai array di backend.
function hazardFormData(payload) {
  const fd = new FormData();
  (payload.hazards || []).forEach((g, i) => {
    fd.append(`hazards[${i}][permit_type_id]`, g.permit_type_id);
    (g.no_bahaya || []).forEach((n, j) => {
      fd.append(`hazards[${i}][no_bahaya][${j}]`, n);
    });
    // pastikan kelompok tanpa centangan tetap terkirim sebagai array kosong
    if (!g.no_bahaya || g.no_bahaya.length === 0) {
      fd.append(`hazards[${i}][no_bahaya]`, "");
    }
  });
  if (payload.nomor_jsa) fd.append("nomor_jsa", payload.nomor_jsa);
  if (payload.jsa_file) fd.append("jsa_file", payload.jsa_file);
  fd.append("tingkat_risiko", payload.tingkat_risiko);
  if (payload.bahaya_lainnya) fd.append("bahaya_lainnya", payload.bahaya_lainnya);
  return fd;
}

// PA melengkapi Bagian 3 (disetujui -> menunggu_penerbitan).
export const submitHazards = (permitId, payload) =>
  api.post(`/permits/${permitId}/hazards`, hazardFormData(payload));

// IA memeriksa/mengubah Bagian 3 (saat menunggu_penerbitan).
// Route backend PUT, tapi karena body FormData dikirim via POST + _method=PUT
// (PHP tidak mem-parsing body multipart pada PUT asli).
export const reviewHazards = (permitId, payload) => {
  const fd = hazardFormData(payload);
  fd.append("_method", "PUT");
  return api.post(`/permits/${permitId}/hazards`, fd);
};

// URL file publik untuk file JSA yang sudah diunggah.
const STORAGE_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "") + "/storage/";
export const jsaFileUrl = (path) => (path ? STORAGE_BASE_URL + path : null);
