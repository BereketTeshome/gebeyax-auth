const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  "postgres://gebeyax:PgGxRSA1%21%40%23@localhost:8001/gebeyax",
  {
    dialect: "postgres",
    logging: false,
  }
);

module.exports = sequelize;
