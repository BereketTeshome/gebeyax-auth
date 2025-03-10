const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/User");
require("dotenv").config();

// 🔹 Local Strategy for Email/Password Login
passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ where: { username } });
        if (!user) return done(null, false, { message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return done(null, false, { message: "Incorrect password" });

        return done(null, user);
      } catch (error) {
        console.log("error login: ", error);
        return done(error);
      }
    }
  )
);

// 🔹 Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: "process.env.GOOGLE_CLIENT_ID",
      clientSecret: "process.env.GOOGLE_CLIENT_SECRET",
      callbackURL: "/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          where: { email: profile.emails[0].value },
        });

        if (!user) {
          user = await User.create({
            // googleId: profile.id,
            email: profile.emails[0].value,
            username: profile.displayName,
          });
          console.log(`New user created: ${user.username} (ID: ${user.id})`);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
