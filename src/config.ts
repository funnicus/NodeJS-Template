import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const portSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(65535, "Port should be >= 0 and <= 65535");

const configSchema = z.object({
  app: z.object({
    name: z.string().default("app"),
    environment: z
      .enum(["test", "development", "production"])
      .default("development"),
    port: portSchema.default(3000),
  }),

  log: z.object({
    level: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),
    samplingRate: z.coerce.number().min(0).max(1).default(0.05),
  }),

  npmPackageVersion: z.string().default("0.0.0"),

  database: z.object({
    port: portSchema.default(5432),
    host: z.string().min(1).default("localhost"),
    user: z.string().min(1).default("postgres"),
    password: z.string().default("postgres"),
    name: z.string().min(1).default("postgres"),
    max: z.coerce.number().int().positive().default(10),
  }),

  otel: z.object({
    serviceName: z.string().default("app"),
    otlpEndpoint: z.url().optional(),
  }),
});

export type Config = z.infer<typeof configSchema>;

const loadedConfig = {
  app: {
    name: process.env["APP_NAME"],
    environment: process.env["NODE_ENV"],
    port: process.env["APP_PORT"],
  },
  log: {
    level: process.env["LOG_LEVEL"],
    samplingRate: process.env["LOG_SAMPLING_RATE"],
  },
  npmPackageVersion: process.env["NPM_PACKAGE_VERSION"],
  database: {
    port: process.env["DATABASE_PORT"],
    host: process.env["DATABASE_HOST"],
    user: process.env["DATABASE_USER"],
    password: process.env["DATABASE_PASSWORD"],
    name: process.env["DATABASE_NAME"],
    max: process.env["DATABASE_MAX"],
  },
  otel: {
    serviceName: process.env["APP_NAME"],
    otlpEndpoint: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  },
};

const result = configSchema.safeParse(loadedConfig);

if (!result.success) {
  console.error("\nEnvironment variables are not set correctly.");
  console.error(
    "Did you remember to `cp .env.example .env` and fill in the values?\n",
  );

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

const config = result.data;

export default config;
