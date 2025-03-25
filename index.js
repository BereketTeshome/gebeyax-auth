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
// app.use("/", authRoutes);

// app.get("/", (req, res) => {
//   res.send(`Node.js is successfully running!!!`);
// });

// Sync database and start server
// sequelize
//   .sync({ force: true })
//   .then(app.listen(5000, () => console.log(`Server running on port 5000`)))
//   .catch((err) => console.error("Error syncing database:", err));
