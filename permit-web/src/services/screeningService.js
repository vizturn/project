import api from "./api";

// Ambil 43 kriteria master untuk form penapisan.
export const getCriteria = () => api.get("/screening-criteria");

// Kirim daftar nomor kriteria yang dicentang.
export const createScreening = (checkedCriteria) =>
  api.post("/screenings", { checked_criteria: checkedCriteria });

export const getScreenings = () => api.get("/screenings");
export const getScreening = (id) => api.get(`/screenings/${id}`);
