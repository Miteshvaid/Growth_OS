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

// ✅ GET PROFILE
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const [notesCount, checkinsCount] = await Promise.all([
      Note.countDocuments({ userId }),
      FocusCheckin.countDocuments({ userId }),
    ]);

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      stats: {
        notes: notesCount,
        streak: req.user.currentStreak,
        logs: checkinsCount,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// ✅ EXPORTS
module.exports = { register, login, getProfile };
