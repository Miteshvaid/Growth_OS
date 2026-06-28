const FocusCheckin = require("../models/FocusCheckin");
const Task = require("../models/Task");
const Note = require("../models/Note");

// Helper: Date format YYYY-MM-DD
const formatDate = (date) => date.toISOString().split("T")[0];

// Helper: Date range
const getDateRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const { start, end } = getDateRange(days);

    // Saara data parallel mein fetch karo
    const [checkins, tasks, notes] = await Promise.all([
      FocusCheckin.find({
        userId,
        date: {
          $gte: formatDate(start),
          $lte: formatDate(end),
        },
      }).sort({ date: 1 }),

      Task.find({
        userId,
        createdAt: { $gte: start, $lte: end },
      }),

      Note.find({
        userId,
        createdAt: { $gte: start, $lte: end },
      }),
    ]);

    // ==========================================
    // 1. FOCUS TREND (date-wise avg focus)
    // ==========================================
    const focusMap = new Map();
    checkins.forEach((c) => {
      if (!focusMap.has(c.date)) {
        focusMap.set(c.date, { total: 0, count: 0 });
      }
      const entry = focusMap.get(c.date);
      entry.total += c.focusRating;
      entry.count += 1;
    });

    const focusTrend = [];
    focusMap.forEach((val, date) => {
      focusTrend.push({
        date,
        avgFocus: parseFloat((val.total / val.count).toFixed(1)),
      });
    });

    // ==========================================
    // 2. ACTIVITY BREAKDOWN
    // ==========================================
    const activityCounts = {};
    checkins.forEach((c) => {
      activityCounts[c.activityType] =
        (activityCounts[c.activityType] || 0) + 1;
    });

    // ==========================================
    // 3. TASK STATS
    // ==========================================
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === "Completed"
    ).length;
    const completionRate =
      totalTasks > 0
        ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(1))
        : 0;

    // Task trend
    const taskMap = new Map();
    tasks.forEach((t) => {
      const dateKey = formatDate(new Date(t.createdAt));
      if (!taskMap.has(dateKey)) {
        taskMap.set(dateKey, { completed: 0, total: 0 });
      }
      const entry = taskMap.get(dateKey);
      entry.total += 1;
      if (t.status === "Completed") entry.completed += 1;
    });

    const taskTrend = [];
    taskMap.forEach((val, date) => {
      taskTrend.push({
        date,
        completed: val.completed,
        total: val.total,
        rate:
          val.total > 0
            ? parseFloat(((val.completed / val.total) * 100).toFixed(1))
            : 0,
      });
    });

    // ==========================================
    // 4. STREAK CALCULATION
    // ==========================================
    const uniqueDates = [
      ...new Set(checkins.map((c) => c.date)),
    ].sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          tempStreak += 1;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // Current streak check
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    if (uniqueDates.includes(today)) {
      currentStreak = tempStreak;
    } else if (uniqueDates.includes(yesterday)) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    // ==========================================
    // 5. SUMMARY
    // ==========================================
    const totalCheckins = checkins.length;
    const avgFocus =
      checkins.length > 0
        ? parseFloat(
            (
              checkins.reduce((sum, c) => sum + c.focusRating, 0) /
              checkins.length
            ).toFixed(1)
          )
        : 0;

    const totalNotes = notes.length;

    // ==========================================
    // RESPONSE
    // ==========================================
    res.json({
      success: true,
      period: `${days} days`,
      summary: {
        totalCheckins,
        totalTasks,
        completedTasks,
        completionRate,
        totalNotes,
        currentStreak,
        maxStreak,
        avgFocus,
      },
      trends: {
        focus: focusTrend,
        tasks: taskTrend,
      },
      breakdown: {
        activities: activityCounts,
      },
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load analytics",
      error: error.message,
    });
  }
};

exports.getWeeklySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = formatDate(new Date());
    const weekAgo = formatDate(new Date(Date.now() - 7 * 86400000));

    const [checkins, tasks] = await Promise.all([
      FocusCheckin.find({
        userId,
        date: { $gte: weekAgo, $lte: today },
      }),
      Task.find({
        userId,
        createdAt: {
          $gte: new Date(Date.now() - 7 * 86400000),
          $lte: new Date(),
        },
      }),
    ]);

    const completedTasks = tasks.filter(
      (t) => t.status === "Completed"
    ).length;
    const avgFocus =
      checkins.length > 0
        ? (
            checkins.reduce((sum, c) => sum + c.focusRating, 0) /
            checkins.length
          ).toFixed(1)
        : 0;

    res.json({
      success: true,
      week: {
        checkins: checkins.length,
        tasksCompleted: completedTasks,
        totalTasks: tasks.length,
        avgFocusRating: parseFloat(avgFocus),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};