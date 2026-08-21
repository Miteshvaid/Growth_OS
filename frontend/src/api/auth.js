import API from "./axiosConfig";

export const login = (data) => API.post("/auth/login", data);
export const register = (data) => API.post("/auth/register", data);
export const getProfile = () => API.get("/auth/profile");
export const updateProfile = (data) => API.put("/auth/profile", data);
export const changePassword = (data) => API.put("/auth/change-password", data);
export const getCustomActivities = () => API.get("/auth/custom-activities");
export const addCustomActivity = (data) => API.post("/auth/custom-activities", data);
export const updateNotificationEmail = (data) => API.put("/auth/notification-email", data);
export const sendTestReport = () => API.post("/auth/send-test-report");
