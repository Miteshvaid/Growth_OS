import API from "./axiosConfig";

export const getHabits = () => API.get("/habits");
export const createHabit = (name) => API.post("/habits", { name });
export const deleteHabit = (id) => API.delete(`/habits/${id}`);
