// import API from "./axiosConfig";

// export const getAnalytics = () => API.get("/analytics");

import API from "./axiosConfig";

// ✅ period backend ko bhejo — 7 / 30 / 90 / 0 (0 = All)
export const getAnalytics = (period = 30) =>
  API.get("/analytics", { params: { period } });

// ✅ Weekly summary bhi chahiye toh:
export const getWeeklySummary = () => API.get("/analytics/weekly");
