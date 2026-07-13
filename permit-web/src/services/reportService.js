import api from "./api";

export const getAuditLogs = () => api.get("/audit-logs");
export const getSummary = (from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return api.get("/reports/summary", { params });
};
