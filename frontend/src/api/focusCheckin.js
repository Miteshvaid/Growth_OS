import API from "./axiosConfig";

export const createCheckin = (data) => API.post("/focus-checkin", data);
export const getTodayCheckins = () => API.get("/focus-checkin/today");
export const getHistory = (date) => API.get("/focus-checkin/history", { params: { date } });
export const getDailySummary = () => API.get("/focus-checkin/summary");