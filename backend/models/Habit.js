const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastCompletedDate: {
      type: String, // "YYYY-MM-DD" format mein store karenge, simple rakhne ke liye
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Habit", habitSchema);
