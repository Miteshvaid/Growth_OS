const FocusCheckin = require("../models/FocusCheckin");
const Note = require("../models/Note");
const Task = require("../models/Task");

const formatDate = (date) => new Date(date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const getDateRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Period safely parse
    let { period = "30" } = req.query;
    let days = parseInt(period, 10);
    if (isNaN(days) || days <= 0) days = 365;
    if (days > 365) days = 365;

    const { start, end } = getDateRange(days);

    const [checkins, notes, allTasks] = await Promise.all([
      FocusCheckin.find({
        userId,
        date: { $gte: formatDate(start), $lte: formatDate(end) },
      }).sort({ date: 1 }),
      Note.find({
        userId,
        createdAt: { $gte: start, $lte: end },
      }),
      Task.find({ userId }),
    ]);

    // 1. FOCUS TREND (date-wise avg focus + count + activities)
    const focusMap = new Map();
    checkins.forEach((c) => {
      if (!focusMap.has(c.date)) {
        focusMap.set(c.date, { total: 0, count: 0, activities: [] });
      }
      const entry = focusMap.get(c.date);
      entry.total += c.focusRating;
      entry.count += 1;
      if (c.activityType && !entry.activities.includes(c.activityType)) {
        entry.activities.push(c.activityType);
      }
    });

    const focusTrend = [];
    focusMap.forEach((val, date) => {
      focusTrend.push({
        date,
        avgFocus: parseFloat((val.total / val.count).toFixed(1)),
        count: val.count,
        activities: val.activities,
      });
    });
    focusTrend.sort((a, b) => a.date.localeCompare(b.date));

    // 2. ACTIVITY BREAKDOWN
    const activityCounts = {};
    checkins.forEach((c) => {
      activityCounts[c.activityType] =
        (activityCounts[c.activityType] || 0) + 1;
    });

    // 3. STREAK
    const uniqueDates = [...new Set(checkins.map((c) => c.date))].sort();
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

    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    if (uniqueDates.includes(today)) {
      currentStreak = tempStreak;
    } else if (uniqueDates.includes(yesterday)) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    // 4. TASK METRICS & TREND
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "done").length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const taskMap = new Map();
    allTasks.forEach((t) => {
      const taskDate = formatDate(new Date(t.createdAt));
      if (!taskMap.has(taskDate)) {
        taskMap.set(taskDate, { total: 0, completed: 0 });
      }
      const item = taskMap.get(taskDate);
      item.total += 1;
      if (t.status === "done") {
        item.completed += 1;
      }
    });

    const taskTrend = [];
    taskMap.forEach((val, date) => {
      taskTrend.push({
        date,
        total: val.total,
        completed: val.completed,
      });
    });
    taskTrend.sort((a, b) => a.date.localeCompare(b.date));

    // 5. DETAILED HISTORY LIST FOR TIMELINE & HEATMAP LOOKUP
    const sessionHistory = checkins.map((c) => ({
      id: c._id,
      activityType: c.activityType,
      emoji: c.emoji || "⚡",
      date: c.date,
      startTime: c.startTime || new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: c.endTime || "",
      duration: c.duration || 25,
      focusRating: c.focusRating,
      notes: c.notes || "",
      goalTitle: c.goalTitle || "",
    }));

    // 6. SUMMARY
    const totalCheckins = checkins.length;
    const totalFocusMinutes = checkins.reduce((sum, c) => sum + (c.duration || 25), 0);
    const avgFocus =
      checkins.length > 0
        ? parseFloat(
            (
              checkins.reduce((sum, c) => sum + c.focusRating, 0) /
              checkins.length
            ).toFixed(1)
          )
        : 0;

    res.json({
      success: true,
      period: `${days} days`,
      summary: {
        totalCheckins,
        totalFocusMinutes,
        totalTasks,
        completedTasks,
        completionRate,
        totalNotes: notes.length,
        currentStreak,
        maxStreak,
        avgFocus,
      },
      trends: { focus: focusTrend, tasks: taskTrend },
      breakdown: { activities: activityCounts },
      sessionHistory,
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
    const weekAgoDate = new Date(Date.now() - 7 * 86400000);

    const [checkins, weeklyTasks] = await Promise.all([
      FocusCheckin.find({
        userId,
        date: { $gte: weekAgo, $lte: today },
      }),
      Task.find({
        userId,
        createdAt: { $gte: weekAgoDate },
      }),
    ]);

    const avgFocus =
      checkins.length > 0
        ? (
            checkins.reduce((sum, c) => sum + c.focusRating, 0) /
            checkins.length
          ).toFixed(1)
        : 0;

    const tasksCompleted = weeklyTasks.filter((t) => t.status === "done").length;

    res.json({
      success: true,
      week: {
        checkins: checkins.length,
        tasksCompleted,
        totalTasks: weeklyTasks.length,
        avgFocusRating: parseFloat(avgFocus),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
