const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateQuizFromNote } = require("../controllers/aiController");

router.post("/generate-quiz/:noteId", protect, generateQuizFromNote);

module.exports = router;
