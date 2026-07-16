import api from "./api";

// Bagian 4 — Referensi Pendukung (khusus PTW Panas/HWP & PTW Dingin/CWP), diisi IA.
export const submitPermitReference = (permitId, payload) =>
  api.post(`/permits/${permitId}/reference`, payload);
