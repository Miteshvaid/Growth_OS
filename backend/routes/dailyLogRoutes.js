const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  upsertDailyLog,
  getTodayLog,
  getAllLogs,
} = require("../controllers/dailyLogController");

router.use(protect);

router.post("/", upsertDailyLog);
router.get("/today", getTodayLog);
router.get("/", getAllLogs);

module.exports = router;
