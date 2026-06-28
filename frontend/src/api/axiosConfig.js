import axios from "axios";

const API = axios.create({
  baseURL: "https://growth-os-h7hi.onrender.com/api",
});

API.interceptors.request.use((req) => {
  // Sab jagah check karo
  const userStr = localStorage.getItem("user");
  let token = localStorage.getItem("token");

  // Agar user object mein token hai
  if (!token && userStr) {
    try {
      const user = JSON.parse(userStr);
      token = user.token || user.accessToken;
    } catch (e) {}
  }

  console.log("Sending token:", token ? "YES" : "NO");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
