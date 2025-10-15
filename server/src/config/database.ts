import dotenv from "dotenv";
import { Sequelize } from "sequelize";
dotenv.config(); // Load biến môi trường từ .env

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbDialect = (process.env.DB_DIALECT as any) || 'mysql';

if (!dbName || !dbUser || !dbPassword || !dbHost) {
  throw new Error("Missing required database environment variables.");
}

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
  }
);

export default sequelize;
