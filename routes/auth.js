const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const secretKey = process.env.SESSION_SECRET;

// 🔹 Register User (Email/Password)
router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      password,
    });
    res.status(201).json({ message: "User registered successfully!", user });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// 🔹 Login User (Email/Password)
router.post("/login", async (req, res) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    if (!user) return res.status(401).json({ error: info.message });

    const token = jwt.sign({ id: user.id, email: user.email }, secretKey, {
      expiresIn: "7d",
    });

    res.status(200).json({ user, token });
  })(req, res);
});

// 🔹 Google OAuth Login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const user = req.user;

    res.cookie(
      "userSession",
      JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
      })
    );

    res.redirect("http://localhost:5173");
  }
);

module.exports = router;
