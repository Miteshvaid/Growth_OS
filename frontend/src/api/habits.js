import axios from "axios";

const API_URL = "http://localhost:5000/api/habits";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getHabits = async () => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data;
};

export const createHabit = async (name) => {
  const response = await axios.post(API_URL, { name }, getAuthHeader());
  return response.data;
};

export const deleteHabit = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};
