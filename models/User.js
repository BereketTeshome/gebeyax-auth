require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

// Initialize Sequelize with DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // Disable logging for cleaner output
});

// Define the User model to support both Google and custom authentication
const User = sequelize.define("Users", {
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, // Ensure no duplicate emails
    validate: {
      isEmail: true, // Validate email format
    },
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true, // Unique for Google users
    allowNull: true, // Allow null for custom-authenticated users
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Only required for custom authentication
  },
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Sync the model with the database
sequelize
  .sync()
  .then(() => console.log("Database synced"))
  .catch((err) => console.error("Error syncing database:", err));

module.exports = User;
