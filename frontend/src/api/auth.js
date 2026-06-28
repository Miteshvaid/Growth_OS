import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

export const registerUser = async (userData) => {
  const response = await API.post("/api/auth/register", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await API.post("/api/auth/login", userData);
  return response.data;
};
