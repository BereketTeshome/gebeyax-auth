const express = require("express");
const session = require("express-session");
const passport = require("passport");
const bodyParser = require("body-parser");
require("dotenv").config();
const sequelize = require("./config/db");
require("./services/passport"); // Initialize Passport strategies

const authRoutes = require("./routes/auth");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/", authRoutes);

// Create a new URL object to parse the database URL
const parsedUrl = new URL(process.env.DATABASE_URL);

// Get the port from the parsed URL
const PGport = parsedUrl.port;

app.get("/", (req, res) => {
  res.send(
    `Node.js is successfully running!!!, PostgreSQL is running on port: ${PGport}`
  );
});

const port = process.env.PORT;

// Sync database and start server
sequelize
  .sync({ force: true }) // ⚠️ This will DROP the table and recreate it!
  .then(app.listen(port, () => console.log(`Server running on port ${port}`)))
  .catch((err) => console.error("Error syncing database:", err));
