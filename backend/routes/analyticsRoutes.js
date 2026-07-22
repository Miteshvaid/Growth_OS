const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAnalytics,
  getWeeklySummary,
} = require("../controllers/analyticsController");

router.get("/", protect, getAnalytics);
router.get("/weekly", protect, getWeeklySummary);

module.exports = router;
