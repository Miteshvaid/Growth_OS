let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  console.log("[EMAIL SERVICE] Notice: nodemailer package not installed yet.");
}

// Create test or SMTP transporter
const createTransporter = () => {
  if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Return test stream if SMTP not configured or nodemailer missing
  return {
    sendMail: async (options) => {
      console.log("----------------------------------------");
      console.log(`[EMAIL SERVICE] Simulating email delivery to: ${options.to}`);
      console.log(`[EMAIL SERVICE] Subject: ${options.subject}`);
      console.log(`[EMAIL SERVICE] Delivery status: SUCCESS (Simulated)`);
      console.log("----------------------------------------");
      return { messageId: "simulated-msg-id-" + Date.now() };
    },
  };
};

const sendProductivityReport = async ({ to, userName, summary, period = "Weekly" }) => {
  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0d1512; color: #f4f7f5; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #16221f;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #34d399; margin: 0; font-size: 28px;">GrowthOS</h1>
        <p style="color: #8b9b95; font-size: 14px; margin-top: 4px;">Your ${period} Productivity Analytics Report</p>
      </div>

      <div style="background-color: #16221f; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="font-size: 18px; color: #ffffff; margin-top: 0;">Hello ${userName || "Productivity Champion"}, 👋</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Here is your comprehensive ${period} report automatically sent from GrowthOS:
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
          <div style="background: #0d1512; padding: 14px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 22px; font-weight: bold; color: #34d399;">${summary.totalCheckins || 0}</div>
            <div style="font-size: 12px; color: #8b9b95;">Focus Check-ins</div>
          </div>
          <div style="background: #0d1512; padding: 14px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 22px; font-weight: bold; color: #38bdf8;">${summary.avgFocus || 0} / 5</div>
            <div style="font-size: 12px; color: #8b9b95;">Avg Focus Rating</div>
          </div>
          <div style="background: #0d1512; padding: 14px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 22px; font-weight: bold; color: #a855f7;">${summary.completedTasks || 0} / ${summary.totalTasks || 0}</div>
            <div style="font-size: 12px; color: #8b9b95;">Tasks Completed</div>
          </div>
          <div style="background: #0d1512; padding: 14px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 22px; font-weight: bold; color: #f59e0b;">${summary.currentStreak || 0} Days</div>
            <div style="font-size: 12px; color: #8b9b95;">Active Streak</div>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        <p>Keep building consistent days. One focused session at a time.</p>
        <p style="margin-top: 8px;">© GrowthOS Productivity Suite</p>
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: `"GrowthOS Reports" <${process.env.SMTP_FROM || "reports@growthos.app"}>`,
    to,
    subject: `🌱 Your GrowthOS ${period} Analytics Report`,
    html: htmlContent,
  });
};

module.exports = { sendProductivityReport };
