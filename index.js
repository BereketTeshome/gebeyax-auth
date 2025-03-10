const express = require("express");
const session = require("express-session");
const passport = require("passport");
const bodyParser = require("body-parser");
require("dotenv").config();
const sequelize = require("./config/db");
require("./services/passport"); // Initialize Passport strategies
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dummy-session-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.send(
    `Node.js is successfully running!!! ${process.env.GOOGLE_CLIENT_ID}, ${process.env.GOOGLE_CLIENT_SECRET}`
  );
});

const port = process.env.PORT;

// Sync database and start server
sequelize
  .sync({ force: true }) // ⚠️ This will DROP the table and recreate it!
  .then(app.listen(port, () => console.log(`Server running on port ${port}`)))
  .catch((err) => console.error("Error syncing database:", err));
