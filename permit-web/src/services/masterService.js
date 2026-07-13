import api from "./api";

export const getPermitTypes = () => api.get("/permit-types");
export const getPsbTypes = () => api.get("/psb-types");
export const getWorkOrders = () => api.get("/work-orders");
export const getEquipment = () => api.get("/equipment");
