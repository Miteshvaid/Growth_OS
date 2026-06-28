import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/focus-checkin",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const createCheckin = (data) => API.post("/", data);
export const getTodayCheckins = () => API.get("/today");
export const getHistory = (date) => API.get("/history", { params: { date } });
export const getDailySummary = () => API.get("/summary");
