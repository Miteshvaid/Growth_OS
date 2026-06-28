const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

exports.register = async (req, res) => {
  try {
    console.log("Register called with:", req.body); // DEBUG

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide all fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = await User.create({ name, email, password });
    console.log("User created:", user._id); // DEBUG

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Register error:", err); // DEBUG
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("Login called with:", req.body); // DEBUG

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", user ? user._id : "No user"); // DEBUG

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Checking password..."); // DEBUG
    const isMatch = await user.matchPassword(password);
    console.log("Password match:", isMatch); // DEBUG

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
    console.error("Login error:", err); // DEBUG
    res.status(500).json({ error: err.message });
  }
};
