const Task = require("../models/Task");

exports.createTask = async (req, res) => {
  try {
    const { title, reminderTime } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const task = await Task.create({
      userId: req.user.id,
      title,
      reminderTime: reminderTime || "19:00",
      date: today,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodayTasks = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const tasks = await Task.find({ userId: req.user.id, date: today });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { status, title, reminderTime } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status, title, reminderTime },
      { new: true },
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkPendingReminders = async (req, res) => {
  try {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const today = now.toISOString().split("T")[0];

    console.log("Checking reminders for:", today, "at", currentTime); // DEBUG

    const pendingTasks = await Task.find({
      userId: req.user.id,
      date: today,
      status: "Pending",
      reminderTime: { $lte: currentTime },
    });

    console.log("Found pending:", pendingTasks.length); // DEBUG
    res.json(pendingTasks);
  } catch (err) {
    console.error("Reminder error:", err); // DEBUG
    res.status(500).json({ error: err.message });
  }
};
