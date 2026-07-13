import api from "./api";

// Master daftar bahaya untuk izin ini (dikelompokkan per jenis izin).
export const getHazardOptions = (permitId) =>
  api.get(`/permits/${permitId}/hazard-options`);

// PA melengkapi Bagian 3 (disetujui -> menunggu_penerbitan).
export const submitHazards = (permitId, payload) =>
  api.post(`/permits/${permitId}/hazards`, payload);

// IA memeriksa/mengubah Bagian 3 (saat menunggu_penerbitan).
export const reviewHazards = (permitId, payload) =>
  api.put(`/permits/${permitId}/hazards`, payload);
