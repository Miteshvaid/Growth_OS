const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Note = require("../models/Note");
const Habit = require("../models/Habit");
const FocusCheckin = require("../models/FocusCheckin");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ✅ REGISTER
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Register called with:", { name, email, password });

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
    console.log("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGIN
const login = async (req, res) => {
  try {
    console.log("Login called with:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", user ? user._id : "No user");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Checking password...");
    const isMatch = await user.matchPassword(password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

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

    console.log("Profile API - UserId:", userId);

    const [notesCount, habits, checkinsCount] = await Promise.all([
      Note.countDocuments({ userId }),
      Habit.find({ userId }),
      FocusCheckin.countDocuments({ userId }),
    ]);

    console.log("Profile API - Notes:", notesCount);
    console.log("Profile API - Habits:", habits.length);
    console.log("Profile API - Checkins:", checkinsCount);

    let currentStreak = 0;
    habits.forEach((h) => {
      if (h.currentStreak > currentStreak) {
        currentStreak = h.currentStreak;
      }
    });

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      stats: {
        notes: notesCount,
        streak: currentStreak,
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
