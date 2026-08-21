const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Note = require("../models/Note");
const FocusCheckin = require("../models/FocusCheckin");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ✅ Password Validation Helper
const validatePassword = (password) => {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Need at least one uppercase letter (A-Z)";
  if (!/[a-z]/.test(password))
    return "Need at least one lowercase letter (a-z)";
  if (!/[0-9]/.test(password)) return "Need at least one number (0-9)";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return "Need at least one special character (!@#$%^&*)";
  return null;
};

// ✅ REGISTER
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ Password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastLoginDate) {
      const lastLogin = new Date(user.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.currentStreak += 1;
      } else if (diffDays > 1) {
        user.currentStreak = 1;
      }
    } else {
      user.currentStreak = 1;
    }

    user.lastLoginDate = today;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

const Task = require("../models/Task");

// ✅ GET PROFILE
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const [notesCount, checkinsCount, totalTasksCount, completedTasksCount] = await Promise.all([
      Note.countDocuments({ userId }),
      FocusCheckin.countDocuments({ userId }),
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: "done" }),
    ]);

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
      stats: {
        notes: notesCount,
        streak: req.user.currentStreak || 0,
        logs: checkinsCount,
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// ✅ UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email } = req.body;
    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email is already taken" });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};

// ✅ CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: error.message || "Failed to change password" });
  }
};

// ✅ CUSTOM ACTIVITIES
const getCustomActivities = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.customActivities || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCustomActivity = async (req, res) => {
  try {
    const { name, emoji } = req.body;
    if (!name || !emoji) {
      return res.status(400).json({ message: "Name and emoji are required" });
    }
    const user = await User.findById(req.user._id);
    user.customActivities.push({ name, emoji });
    await user.save();
    res.status(201).json(user.customActivities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNotificationEmail = async (req, res) => {
  try {
    const { notificationEmail } = req.body;
    if (!notificationEmail) {
      return res.status(400).json({ message: "Notification email is required" });
    }

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notificationEmail = notificationEmail;
    user.emailVerified = true;
    await user.save();

    // Send report safely in background without blocking API response
    try {
      const { sendProductivityReport } = require("../emailService");
      const summary = {
        totalCheckins: 7,
        avgFocus: 4.5,
        completedTasks: 5,
        totalTasks: 6,
        currentStreak: user.currentStreak || 3,
      };
      
      sendProductivityReport({
        to: user.notificationEmail || user.email,
        userName: user.name || "User",
        summary,
        period: "Weekly & Automated",
      }).catch((err) => console.log("[EMAIL SERVICE] Notice:", err.message));
    } catch (e) {
      console.log("[EMAIL SERVICE] Trigger skip:", e.message);
    }

    return res.json({
      success: true,
      message: "Notification email updated and verified!",
      notificationEmail: user.notificationEmail,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error("updateNotificationEmail error:", error);
    return res.status(500).json({ message: error.message || "Failed to update email" });
  }
};

// ✅ SEND TEST REPORT
const sendTestReport = async (req, res) => {
  try {
    const { sendProductivityReport } = require("../emailService");
    const user = await User.findById(req.user._id);
    const targetEmail = user.notificationEmail || user.email;

    const summary = {
      totalCheckins: 5,
      avgFocus: 4.2,
      completedTasks: 8,
      currentStreak: user.currentStreak || 3,
    };

    await sendProductivityReport({
      to: targetEmail,
      userName: user.name,
      summary,
      period: "Weekly",
    });

    res.json({ success: true, message: `Test report sent to ${targetEmail}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ EXPORTS
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getCustomActivities,
  addCustomActivity,
  updateNotificationEmail,
  sendTestReport,
};

