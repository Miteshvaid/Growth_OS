const mongoose = require("mongoose");

const focusCheckinSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  activityType: {
    type: String,
    required: true,
    trim: true,
  },
  emoji: { type: String, default: "⚡" },
  focusRating: { type: Number, min: 1, max: 5, required: true },
  duration: { type: Number, default: 25 }, // in minutes
  startTime: { type: String },
  endTime: { type: String },
  notes: { type: String, default: "" },
  goalTitle: { type: String, default: "" },
  date: { type: String, required: true },
});

module.exports = mongoose.model("FocusCheckin", focusCheckinSchema);

