const FocusCheckin = require("../models/FocusCheckin");

// POST /api/focus-checkin - Naya check-in create
exports.createCheckin = async (req, res) => {
  try {
    const {
      activityType,
      emoji,
      focusRating,
      duration = 25,
      startTime,
      endTime,
      notes = "",
      goalTitle = "",
      date,
    } = req.body;

    const now = new Date();
    const localDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
    const localTimeStr = now.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

    const today = date || localDateStr;

    const checkin = await FocusCheckin.create({
      userId: req.user.id,
      activityType,
      emoji: emoji || "⚡",
      focusRating: Number(focusRating),
      duration: Number(duration),
      startTime: startTime || localTimeStr,
      endTime: endTime || localTimeStr,
      notes,
      goalTitle,
      date: today,
    });

    res.status(201).json(checkin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET /api/focus-checkin/today - Aaj ke check-ins
exports.getTodayCheckins = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const checkins = await FocusCheckin.find({
      userId: req.user.id,
      date: today,
    }).sort({ timestamp: 1 });

    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/focus-checkin/reset-today - Reset today's activities
exports.resetTodayCheckins = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const userId = req.user._id || req.user.id;
    
    // Reset all checkins for today regardless of string format or objectid
    await FocusCheckin.deleteMany({
      $and: [
        {
          $or: [
            { userId: userId },
            { userId: String(userId) },
            { userId: req.user._id },
            { userId: req.user.id }
          ]
        },
        {
          $or: [
            { date: today },
            { date: { $regex: today } }
          ]
        }
      ]
    });
    
    res.json({ success: true, message: "Today's check-ins reset successfully" });
  } catch (err) {
    console.error("Reset checkins error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/focus-checkin/history - Poora history
exports.getHistory = async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.user.id };
    if (date) query.date = date;

    const checkins = await FocusCheckin.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/focus-checkin/summary - Aaj ka summary
exports.getDailySummary = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const checkins = await FocusCheckin.find({
      userId: req.user.id,
      date: today,
    });

    const total = checkins.length;
    if (total === 0)
      return res.json({
        message: "No check-ins today",
        total: 0,
        totalFocusMinutes: 0,
        avgFocus: 0,
        completedSessions: 0,
        longestSession: 0,
        topActivity: "None",
        activityBreakdown: {},
        insights: ["Start your first focus session today!"],
      });

    const activityCounts = {};
    let totalFocusMinutes = 0;
    let longestSession = 0;

    checkins.forEach((c) => {
      activityCounts[c.activityType] =
        (activityCounts[c.activityType] || 0) + 1;
      const dur = c.duration || 25;
      totalFocusMinutes += dur;
      if (dur > longestSession) longestSession = dur;
    });

    let topActivity = "None";
    let maxCount = 0;
    Object.entries(activityCounts).forEach(([act, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topActivity = act;
      }
    });

    const avgFocus = parseFloat(
      (checkins.reduce((sum, c) => sum + c.focusRating, 0) / total).toFixed(1)
    );

    const distractedCount = activityCounts["Distracted"] || 0;
    const breakCount = activityCounts["Break"] || 0;
    const productiveCount = total - distractedCount - breakCount;

    res.json({
      total,
      avgFocus,
      totalFocusMinutes,
      completedSessions: total - breakCount,
      longestSession,
      topActivity,
      productivePercent: Math.max(0, Math.round((productiveCount / total) * 100)),
      distractedCount,
      activityBreakdown: activityCounts,
      insights: generateInsights(
        checkins,
        total,
        productiveCount,
        distractedCount,
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


function generateInsights(checkins, total, productive, distracted) {
  const insights = [];

  if (total >= 5) {
    insights.push(`You logged ${total} check-ins today. Great tracking!`);
  }

  if (productive > 0) {
    insights.push(
      `${Math.round((productive / total) * 100)}% of your time was productive.`,
    );
  }

  if (distracted > 0) {
    insights.push(
      `You got distracted ${distracted} time${distracted > 1 ? "s" : ""}.`,
    );
  }

  for (let i = 1; i < checkins.length; i++) {
    if (
      checkins[i - 1].activityType === "Distracted" &&
      checkins[i].focusRating < 3
    ) {
      insights.push(
        "Your focus dropped after a distraction — try shorter work blocks.",
      );
      break;
    }
  }

  return insights;
}
