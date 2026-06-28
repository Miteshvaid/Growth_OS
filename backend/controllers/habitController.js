const Habit = require("../models/Habit");

exports.createHabit = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Habit name zaroori hai" });

    const habit = await Habit.create({ userId: req.userId, name });
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!habit) return res.status(404).json({ message: "Habit nahi mila" });
    res.status(200).json({ message: "Habit delete ho gaya" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
