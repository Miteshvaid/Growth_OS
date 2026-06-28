const mongoose = require("mongoose");

const focusCheckinSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  activityType: {
    type: String,
    enum: ["Studying", "Coding", "Distracted", "Break", "Other"],
    required: true,
  },
  focusRating: { type: Number, min: 1, max: 5, required: true },
  date: { type: String, required: true },
});

module.exports = mongoose.model("FocusCheckin", focusCheckinSchema);
