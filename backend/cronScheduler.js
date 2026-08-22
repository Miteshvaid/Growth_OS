const cron = require("node-cron");
const User = require("./models/User");
const FocusCheckin = require("./models/FocusCheckin");
const Task = require("./models/Task");
const { sendProductivityReport } = require("./emailService");

// Start automated daily & weekly cron jobs
const startReportCronJobs = () => {
  const cronOptions = { scheduled: true, timezone: "Asia/Kolkata" };

  // Helper to fetch all users having notificationEmail or main account email
  const getUsersToNotify = async () => {
    return await User.find({
      $or: [
        { notificationEmail: { $exists: true, $ne: "" } },
        { email: { $exists: true, $ne: "" } },
      ],
    });
  };

  // ⏰ Daily Reports: Runs at 9:00 AM (09:00) IST and 9:00 PM (21:00) IST
  cron.schedule("0 9,21 * * *", async () => {
    console.log("⏰ [CRON] Starting Daily Analytics Email Dispatch...");
    try {
      const users = await getUsersToNotify();
      const today = new Date().toISOString().split("T")[0];

      for (const user of users) {
        const recipientEmail = user.notificationEmail || user.email;
        if (!recipientEmail) continue;

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
          to: recipientEmail,
          userName: user.name,
          summary,
          period: "Daily",
        });
        console.log(`✅ [CRON] Daily report sent to ${recipientEmail}`);
      }
    } catch (err) {
      console.error("❌ [CRON] Daily report error:", err.message);
    }
  }, cronOptions);

  // ⏰ 2. Weekly Report: Runs Every Sunday at 9:30 PM IST
  cron.schedule("30 21 * * 0", async () => {
    console.log("⏰ [CRON] Starting Weekly Analytics Email Dispatch...");
    try {
      const users = await getUsersToNotify();
      for (const user of users) {
        const recipientEmail = user.notificationEmail || user.email;
        if (!recipientEmail) continue;

        const [checkins, completedTasksCount, totalTasksCount] = await Promise.all([
          FocusCheckin.find({ userId: user._id }),
          Task.countDocuments({ userId: user._id, status: "done" }),
          Task.countDocuments({ userId: user._id }),
        ]);

        const summary = {
          totalCheckins: checkins.length,
          avgFocus: checkins.length ? parseFloat((checkins.reduce((s, c) => s + c.focusRating, 0) / checkins.length).toFixed(1)) : 0,
          completedTasks: completedTasksCount,
          totalTasks: totalTasksCount,
          currentStreak: user.currentStreak || 1,
        };

        await sendProductivityReport({
          to: recipientEmail,
          userName: user.name,
          summary,
          period: "Weekly",
        });
        console.log(`✅ [CRON] Weekly report sent to ${recipientEmail}`);
      }
    } catch (err) {
      console.error("❌ [CRON] Weekly report error:", err.message);
    }
  }, cronOptions);

  // ⏰ 3. Monthly Report: Runs on 1st of Every Month at 10:00 PM IST
  cron.schedule("0 22 1 * *", async () => {
    console.log("⏰ [CRON] Starting Monthly Analytics Email Dispatch...");
    try {
      const users = await getUsersToNotify();
      for (const user of users) {
        const recipientEmail = user.notificationEmail || user.email;
        if (!recipientEmail) continue;

        const [checkins, completedTasksCount, totalTasksCount] = await Promise.all([
          FocusCheckin.find({ userId: user._id }),
          Task.countDocuments({ userId: user._id, status: "done" }),
          Task.countDocuments({ userId: user._id }),
        ]);

        const summary = {
          totalCheckins: checkins.length,
          avgFocus: checkins.length ? parseFloat((checkins.reduce((s, c) => s + c.focusRating, 0) / checkins.length).toFixed(1)) : 0,
          completedTasks: completedTasksCount,
          totalTasks: totalTasksCount,
          currentStreak: user.currentStreak || 1,
        };

        await sendProductivityReport({
          to: recipientEmail,
          userName: user.name,
          summary,
          period: "Monthly",
        });
        console.log(`✅ [CRON] Monthly report sent to ${recipientEmail}`);
      }
    } catch (err) {
      console.error("❌ [CRON] Monthly report error:", err.message);
    }
  }, cronOptions);

  console.log("🚀 [CRON] Automated Daily, Weekly & Monthly Email Report Scheduler initialized (Asia/Kolkata)");
};

module.exports = { startReportCronJobs };
