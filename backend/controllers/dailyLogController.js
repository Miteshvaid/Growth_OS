const DailyLog = require("../models/DailyLog");
const Habit = require("../models/Habit");

// Helper: aaj ki date "YYYY-MM-DD" format mein
const getTodayDate = () => new Date().toISOString().split("T")[0];

// Helper: kal ki date nikalna (streak check ke liye)
const getYesterdayDate = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

// CREATE OR UPDATE TODAY'S LOG
exports.upsertDailyLog = async (req, res) => {
  try {
    const { mood, reflection, habitsCompleted } = req.body;
    const date = getTodayDate();

    if (!mood)
      return res.status(400).json({ message: "Mood select karna zaroori hai" });

    let log = await DailyLog.findOne({ userId: req.userId, date });

    if (log) {
      // Already aaj ka log hai — update karo
      log.mood = mood;
      log.reflection = reflection ?? log.reflection;
      log.habitsCompleted = habitsCompleted ?? log.habitsCompleted;
      await log.save();
    } else {
      // Naya log banao
      log = await DailyLog.create({
        userId: req.userId,
        date,
        mood,
        reflection,
        habitsCompleted: habitsCompleted || [],
      });
    }

    // Streak logic: jo habits complete hui, unka streak update karo
    if (habitsCompleted && habitsCompleted.length > 0) {
      for (const habitId of habitsCompleted) {
        const habit = await Habit.findOne({ _id: habitId, userId: req.userId });
        if (!habit) continue;

        const yesterday = getYesterdayDate(date);

        if (habit.lastCompletedDate === date) {
          // Aaj already mark thi, kuch nahi karna
          continue;
        } else if (habit.lastCompletedDate === yesterday) {
          // Continuous streak
          habit.currentStreak += 1;
        } else {
          // Streak break ho gayi thi, naye se shuru
          habit.currentStreak = 1;
        }

        if (habit.currentStreak > habit.longestStreak) {
          habit.longestStreak = habit.currentStreak;
        }

        habit.lastCompletedDate = date;
        await habit.save();
      }
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET TODAY'S LOG
exports.getTodayLog = async (req, res) => {
  try {
    const date = getTodayDate();
    const log = await DailyLog.findOne({ userId: req.userId, date });
    res.status(200).json(log || null);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL LOGS (history — analytics ke liye baad mein use hoga)
exports.getAllLogs = async (req, res) => {
  try {
    const logs = await DailyLog.find({ userId: req.userId }).sort({ date: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
