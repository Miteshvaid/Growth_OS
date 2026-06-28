const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const controller = require("../controllers/focusCheckinController");

router.post("/", protect, controller.createCheckin);
router.get("/today", protect, controller.getTodayCheckins);
router.get("/history", protect, controller.getHistory);
router.get("/summary", protect, controller.getDailySummary);

module.exports = router;
