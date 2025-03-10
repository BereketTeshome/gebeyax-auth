const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

const sequelize = new Sequelize(
  // "postgres://postgres:462462b@@localhost:5432/postgres",
  "postgres://gebeyax:PgGxRSA1%21%40%23@localhost:8001/gebeyax",
  {
    dialect: "postgres",
    logging: false,
  }
);

// Users Table
const Users = sequelize.define("Users", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Auto-generate UUID
    primaryKey: true,
  },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  about: { type: DataTypes.TEXT },
  gender: { type: DataTypes.STRING },
  theme_id: { type: DataTypes.TEXT },
  lang_id: { type: DataTypes.TEXT },
  pp: { type: DataTypes.JSONB },
  cp: { type: DataTypes.JSONB },
  minio_access_key: { type: DataTypes.STRING },
  minio_secret_key: { type: DataTypes.STRING },
});

// Authentications Table
const Authentications = sequelize.define("Authentications", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Auto-generate UUID
    primaryKey: true,
  },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  hashed_password: { type: DataTypes.STRING, allowNull: false },
  passwordConfirmation: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  phone: { type: DataTypes.STRING, unique: true },
  email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  recovery_email: { type: DataTypes.STRING, unique: true },
  tfa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  user_id: {
    type: DataTypes.UUID,
    references: {
      model: Users,
      key: "id",
    },
    allowNull: false,
  },
});

// Define relationships
Users.hasOne(Authentications, { foreignKey: "user_id", onDelete: "CASCADE" });
Authentications.belongsTo(Users, { foreignKey: "user_id" });

// Sync models
sequelize.sync({ alter: true });

module.exports = { Users, Authentications };
