import api from "./api";

export const getNotifications = () => api.get("/notifications");
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`);
