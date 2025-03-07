const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Users, Authentications } = require("../models/User"); // Import both models

const router = express.Router();
const secretKey = process.env.SESSION_SECRET;

// 🔹 Register User (Email/Password)
router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, username, email, password, phone } =
      req.body;

    if (!first_name || !last_name || !username || !email || !password) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled." });
    }

    // Check if email or username already exists
    const existingEmail = await Authentications.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const existingUsername = await Authentications.findOne({
      where: { username },
    });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken." });
    }

    const transaction = await Users.sequelize.transaction(); // Start transaction

    try {
      // Step 1: Create user record
      const user = await Users.create(
        { first_name, last_name },
        { transaction }
      );

      // Step 2: Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Step 3: Create authentication record linked to user
      await Authentications.create(
        {
          username,
          email,
          phone,
          hashed_password: hashedPassword,
          user_id: user.id,
          tfa: false, // Default value
          metadata: {}, // Default empty JSONB
        },
        { transaction }
      );

      await transaction.commit(); // Commit if both inserts succeed

      res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
      await transaction.rollback(); // Rollback if any step fails
      throw error;
    }
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// 🔹 Login User (Email/Password)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // Find authentication record
    const authRecord = await Authentications.findOne({ where: { email } });
    if (!authRecord) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Compare password
    const validPassword = await bcrypt.compare(
      password,
      authRecord.hashed_password
    );
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: authRecord.user_id, email }, secretKey, {
      expiresIn: "7d",
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// 🔹 Google OAuth Login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const user = req.user;

      // Store authentication in cookies or return a token
      const token = jwt.sign({ id: user.id, email: user.email }, secretKey, {
        expiresIn: "7d",
      });

      res.cookie("userSession", token, { httpOnly: true });

      res.redirect("http://localhost:5173");
    } catch (error) {
      console.error("OAuth Error:", error);
      res.redirect("/login");
    }
  }
);

module.exports = router;
