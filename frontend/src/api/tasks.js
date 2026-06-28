import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api/tasks" });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const createTask = (data) => API.post("/", data);
export const getTodayTasks = () => API.get("/today");
export const updateTask = (id, data) => API.put(`/${id}`, data);
export const deleteTask = (id) => API.delete(`/${id}`);
export const checkReminders = () => API.get("/reminders");
