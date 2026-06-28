const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getAnalytics } = require("../controllers/analyticsController");

// ❌ HATAO: router.use(protect);
// ✅ Direct route pe lagao:
router.get("/", protect, getAnalytics);

module.exports = router;
