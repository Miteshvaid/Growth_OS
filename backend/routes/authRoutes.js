const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getCustomActivities,
  addCustomActivity,
  updateNotificationEmail,
  sendTestReport,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.get("/custom-activities", protect, getCustomActivities);
router.post("/custom-activities", protect, addCustomActivity);
router.put("/notification-email", protect, updateNotificationEmail);
router.post("/send-test-report", protect, sendTestReport);

module.exports = router;
