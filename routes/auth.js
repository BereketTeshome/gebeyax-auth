const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Users, Authentications } = require("../models/User"); // Import both models

const router = express.Router();

// const ""secretKey"" = process.env.SESSION_SECRET;

function generateRandomKey(length = 20) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// import { OAuth2Client } from "google-auth-library";
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID = process.env.CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

router.post("/login/google", async (req, res) => {
  const { token } = req.body; // Google ID token from client

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name;
    const picture = payload.picture;

    // Check if user already exists in DB
    let user = await Users.findOne({ where: { email } });

    // If not, register them
    if (!user) {
      user = await Users.create({
        email,
        fullName,
        googleId,
        profileImage: picture,
        role: "customer",
      });
    }

    // ❗ Fix: Rename this variable so it's not the same as above
    const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Invalid Google token", error);
    return res.status(401).json({ message: "Invalid Google token" });
  }
});
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
        {
          first_name,
          last_name,
          minio_access_key: generateRandomKey(),
          minio_secret_key: generateRandomKey(),
        },
        { transaction }
      );

      // Step 2: Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Step 3: Create authentication record linked to user
      const authRecord = await Authentications.create(
        {
          username,
          email,
          phone,
          hashed_password: hashedPassword,
          passwordConfirmation: hashedPassword,
          user_id: user.id,
          tfa: false,
          metadata: {},
        },
        { transaction }
      );

      await transaction.commit(); // Commit if all inserts succeed

      // Step 4: Generate JWT token
      const token = jwt.sign(
        { id: authRecord.user_id, username },
        "secretKey", // Use the same `"secretKey"` as in your `login` route
        { expiresIn: "7d" }
      );

      res.status(201).json({
        token,
        userId: String(authRecord.user_id),
        authentication: {
          ...authRecord.get(), // Extracts only the data values
          id: String(authRecord.id),
        },
      });
    } catch (error) {
      await transaction.rollback(); // Rollback if any step fails
      throw error;
    }
  } catch (error) {
    console.error("Error: ", error);
    res
      .status(500)
      .json({ error: "Internal server error.", loggedError: error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    // Fetch authentication record and include associated user data
    const authRecord = await Authentications.findOne({
      where: { username },
      include: [{ model: Users, as: "user" }],
    });

    if (!authRecord) {
      return res.status(401).json({ error: "Invalid auth record." });
    }

    // Validate password
    const validPassword = await bcrypt.compare(
      password,
      authRecord.passwordConfirmation
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid credentials.",
        hashedPass: authRecord.hashed_password,
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: authRecord.user_id, username }, "secretKey", {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      userId: String(authRecord.user_id),
      authentication: {
        id: String(authRecord.id),
        username: authRecord.username,
        email: authRecord.email,
        phone: authRecord.phone,
        emailVerified: authRecord.email_verified,
        recoveryEmail: authRecord.recovery_email,
      },
    });
  } catch (error) {
    console.error("Error during login::", error);
    res.status(500).json({ error: "Internal server error" });
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
