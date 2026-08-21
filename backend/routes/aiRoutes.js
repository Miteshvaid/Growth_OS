const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateQuizFromNote, summarizeNote } = require("../controllers/aiController");

router.post("/generate-quiz/:noteId", protect, generateQuizFromNote);
router.post("/summarize/:noteId", protect, summarizeNote);

module.exports = router;
