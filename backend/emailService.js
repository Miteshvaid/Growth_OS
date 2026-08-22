let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  console.log("[EMAIL SERVICE] Notice: nodemailer package not installed yet.");
}

const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

// Create test or SMTP transporter
const createTransporter = () => {
  if (nodemailer && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      family: 4, // Force IPv4 to prevent ENETUNREACH on Render/cloud servers
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

  // Generate a formatted PDF attachment
  let attachments = [];
  try {
    const { jsPDF } = require("jspdf");
    const doc = new jsPDF();

    // PDF Styling & Header
    doc.setFillColor(13, 21, 18);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(52, 211, 153);
    doc.setFontSize(22);
    doc.text("GrowthOS", 14, 22);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(11);
    doc.text(`Official ${period} Productivity Analytics Report`, 14, 32);

    // User details
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text(`Member: ${userName || "Productivity Champion"}`, 14, 52);
    doc.setFontSize(10);
    doc.text(`Generated Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 60);

    // Summary Section
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 68, 182, 60, 4, 4, "F");

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Performance Summary Overview", 20, 80);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`• Total Focus Check-ins: ${summary.totalCheckins || 0}`, 24, 92);
    doc.text(`• Average Focus Rating: ${summary.avgFocus || 0} / 5`, 24, 100);
    doc.text(`• Tasks Completed: ${summary.completedTasks || 0} / ${summary.totalTasks || 0}`, 24, 108);
    doc.text(`• Active Focus Streak: ${summary.currentStreak || 0} Days`, 24, 116);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("GrowthOS Analytics Suite • Automatic Periodical Report", 14, 280);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    attachments.push({
      filename: `GrowthOS_${period}_Report.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  } catch (err) {
    console.log("[EMAIL SERVICE] PDF Generation Notice:", err.message);
  }

  return await transporter.sendMail({
    from: process.env.SMTP_USER || `"GrowthOS Reports" <reports@growthos.app>`,
    to,
    subject: `🌱 Your GrowthOS ${period} Analytics Report (PDF Attached)`,
    html: htmlContent,
    attachments,
  });
};

module.exports = { sendProductivityReport };
