const FocusCheckin = require("../models/FocusCheckin");

// POST /api/focus-checkin - Naya check-in create
exports.createCheckin = async (req, res) => {
  try {
    const { activityType, focusRating } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const checkin = await FocusCheckin.create({
      userId: req.user.id,
      activityType,
      focusRating,
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
    const today = new Date().toISOString().split("T")[0];
    const checkins = await FocusCheckin.find({
      userId: req.user.id,
      date: today,
    }).sort({ timestamp: 1 });

    res.json(checkins);
  } catch (err) {
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
    const today = new Date().toISOString().split("T")[0];
    const checkins = await FocusCheckin.find({
      userId: req.user.id,
      date: today,
    });

    const total = checkins.length;
    if (total === 0)
      return res.json({ message: "No check-ins today", total: 0 });

    const activityCounts = {};
    checkins.forEach((c) => {
      activityCounts[c.activityType] =
        (activityCounts[c.activityType] || 0) + 1;
    });

    const avgFocus = (
      checkins.reduce((sum, c) => sum + c.focusRating, 0) / total
    ).toFixed(1);
    const productiveCount =
      (activityCounts["Studying"] || 0) + (activityCounts["Coding"] || 0);
    const distractedCount = activityCounts["Distracted"] || 0;

    res.json({
      total,
      avgFocus,
      productivePercent: Math.round((productiveCount / total) * 100),
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
