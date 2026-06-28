import API from "./axiosConfig";

export const getAnalytics = () => API.get("/analytics");
