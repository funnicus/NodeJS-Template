import dotenv from "dotenv";
dotenv.config();

const config = {
  environment: process.env["NODE_ENV"],
  port: process.env["APP_PORT"] || 3000,
  logLevel: process.env["LOG_LEVEL"] || "info",
  database: {
    port: Number(process.env["DATABASE_PORT"]) || 5432,
    host: process.env["DATABASE_HOST"] || "localhost",
    user: process.env["DATABASE_USER"] || "postgres",
    password: process.env["DATABASE_PASSWORD"] || "postgres",
    name: process.env["DATABASE_NAME"] || "postgres",
    max: Number(process.env["DATABASE_MAX"]) || 10,
  },
};

export default config;
