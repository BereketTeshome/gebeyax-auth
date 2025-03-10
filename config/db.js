const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  "postgres://postgres:462462b@@localhost:5432/postgres",
  // "postgres://gebeyax:PgGxRSA1%21%40%23@localhost:8001/gebeyax",
  {
    dialect: "postgres",
    logging: false,
  }
);

module.exports = sequelize;
