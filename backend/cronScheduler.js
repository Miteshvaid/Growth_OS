const cron = require("node-cron");
const User = require("./models/User");
const FocusCheckin = require("./models/FocusCheckin");
const Task = require("./models/Task");
const { sendProductivityReport } = require("./emailService");

// Start automated daily & weekly cron jobs
const startReportCronJobs = () => {
  // ⏰ Runs every night at 9:00 PM (21:00) IST
  cron.schedule("0 21 * * *", async () => {
    console.log("⏰ [CRON] Starting Daily Analytics Email Dispatch...");
    try {
      const users = await User.find({ notificationEmail: { $exists: true, $ne: "" } });
      const today = new Date().toISOString().split("T")[0];

      for (const user of users) {
        const [checkins, completedTasksCount, totalTasksCount] = await Promise.all([
          FocusCheckin.find({ userId: user._id, date: today }),
          Task.countDocuments({ userId: user._id, status: "done" }),
          Task.countDocuments({ userId: user._id }),
        ]);

        const totalCheckins = checkins.length;
        const avgFocus =
          totalCheckins > 0
            ? parseFloat((checkins.reduce((s, c) => s + c.focusRating, 0) / totalCheckins).toFixed(1))
            : 0;

        const summary = {
          totalCheckins,
          avgFocus,
          completedTasks: completedTasksCount,
          totalTasks: totalTasksCount,
          currentStreak: user.currentStreak || 1,
        };

        await sendProductivityReport({
          to: user.notificationEmail || user.email,
          userName: user.name,
          summary,
          period: "Daily",
        });
        console.log(`✅ [CRON] Daily report sent to ${user.notificationEmail}`);
      }
    } catch (err) {
      console.error("❌ [CRON] Daily report error:", err.message);
    }
  });

  console.log("🚀 [CRON] Automated Daily Email Report Scheduler initialized (Runs daily at 9:00 PM IST)");
};

module.exports = { startReportCronJobs };
