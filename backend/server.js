const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection - options hataye (not supported in new mongoose)
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/garden")
  .then(() => console.log("🌱 MongoDB Connected - Garden DB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

const User = require("./models/User");
const Task = require("./models/Task");
const Note = require("./models/Note");
const Habit = require("./models/Habit");
const DailyLog = require("./models/DailyLog");
const FocusCheckin = require("./models/FocusCheckin");

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/habits", require("./routes/habitRoutes"));
app.use("/api/daily-logs", require("./routes/dailyLogRoutes"));
app.use("/api/focus", require("./routes/focusCheckinRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

app.get("/", (req, res) => {
  res.json({
    message: "🌱 Garden API is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
