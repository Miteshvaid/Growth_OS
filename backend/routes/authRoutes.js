const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

console.log("=== AUTH CONTROLLER DEBUG ===");
console.log("authController:", authController);
console.log("Keys:", Object.keys(authController));
console.log("register:", typeof authController.register);
console.log("login:", typeof authController.login);
console.log("============================");

const { register, login } = authController;

router.post("/register", register);
router.post("/login", login);

module.exports = router;
