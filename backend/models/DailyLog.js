const mongoose = require("mongoose");

const dailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD" — ek din ki ek hi entry
      required: true,
    },
    mood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "terrible"],
      required: true,
    },
    reflection: {
      type: String,
      default: "",
    },
    habitsCompleted: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Habit",
      default: [],
    },
  },
  { timestamps: true },
);

// Ek user ka ek din mein sirf ek hi log ho sakta hai
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyLog", dailyLogSchema);
