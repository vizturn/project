import api from "./api";

export const getPermits = (scope) =>
  api.get("/permits", { params: scope ? { scope } : {} });
export const getPermit = (id) => api.get(`/permits/${id}`);
export const createPermit = (payload) => api.post("/permits", payload);
export const updatePermit = (id, payload) => api.put(`/permits/${id}`, payload);
export const submitPermit = (id) => api.post(`/permits/${id}/submit`);
// psb: [{ permit_type_id, psb_type_ids: [...] }, ...]
export const approvePermit = (id, psb) =>
  api.post(`/permits/${id}/approve`, { psb });
export const rejectPermit = (id, alasan) =>
  api.post(`/permits/${id}/reject`, { alasan });
// Bagian 5/6 — Penerbitan (IA). payload opsional { tanggal, jam } khusus WAH; kosongkan untuk jenis lain (now() otomatis).
export const issuePermit = (id, payload = {}) => api.post(`/permits/${id}/issue`, payload);
export const addGasTest = (id, payload) => api.post(`/permits/${id}/gas-tests`, payload);
// Bagian 8 — Pengembalian: PA menuliskan tanggal & jam pengembalian.
export const returnPermit = (id, payload) => api.post(`/permits/${id}/return`, payload);
// Bagian 8 — Revalidasi: IA boleh mengoreksi tanggal & jam sebelum konfirmasi.
export const revalidatePermit = (id, payload) => api.post(`/permits/${id}/revalidate`, payload);
export const completePermit = (id) => api.post(`/permits/${id}/complete`);
export const closePermit = (id) => api.post(`/permits/${id}/close`);
export const addLiveAudit = (id, catatan) => api.post(`/permits/${id}/live-audits`, { catatan });

// STEP 27 — Bagian 4: Referensi Pendukung (IA)
export const storeReferences = (id, payload) => {
  const fd = new FormData();
  // Field teks (lewati null & objek file).
  const teksKeys = [
    "ref_permit_cse", "ref_permit_wah", "cert_isolation",
    "cert_scaffolding", "cert_excavation",
    "sistem_safety_dinonaktifkan", "referensi_lainnya",
  ];
  teksKeys.forEach((k) => {
    if (payload[k] != null) fd.append(k, payload[k]);
  });
  fd.append("cert_isolation_diperlukan", payload.cert_isolation_diperlukan ? 1 : 0);
  if (payload.cert_isolation_file) fd.append("cert_isolation_file", payload.cert_isolation_file);
  return api.post(`/permits/${id}/references`, fd);
};

// STEP 27 — Bagian 5: IA menetapkan pengujian gas yang wajib
export const storeGasRequirement = (id, payload) =>
  api.post(`/permits/${id}/gas-requirement`, payload);

// STEP 27 — Bagian 6/7: Penerimaan PTW oleh PA (menunggu_penerimaan -> aktif)
// payload opsional { tanggal, jam } khusus WAH; kosongkan untuk jenis lain (now() otomatis).
export const acceptPermit = (id, payload = {}) =>
  api.post(`/permits/${id}/accept`, { pernyataan: true, ...payload });
