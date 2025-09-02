import dotenv from "dotenv";
import { Sequelize } from "sequelize";
dotenv.config(); // Load biến môi trường từ .env

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT,
  }
);

export default sequelize;
