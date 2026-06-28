const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createHabit,
  getHabits,
  deleteHabit,
} = require("../controllers/habitController");

router.post("/", protect, createHabit);
router.get("/", protect, getHabits);
router.delete("/:id", protect, deleteHabit);

module.exports = router;
