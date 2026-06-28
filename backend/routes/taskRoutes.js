const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
let protect;
if (typeof auth === "function") {
  protect = auth;
} else {
  protect = auth.protect;
}

const controller = require("../controllers/taskController");

router.post("/", protect, controller.createTask);
router.get("/today", protect, controller.getTodayTasks);
router.put("/:id", protect, controller.updateTask);
router.delete("/:id", protect, controller.deleteTask);
router.get("/reminders", protect, controller.checkPendingReminders);

module.exports = router;
