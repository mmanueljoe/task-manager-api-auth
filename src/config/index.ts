import pino from "pino";
import { env } from "node:process";

const isDev = env["NODE_ENV"] !== "production";

const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});

export { logger };

export const config = {
  get jwtSecret() {
    const secret = env["JWT_SECRET"];
    if (!secret) {
      logger.fatal("JWT_SECRET environment variable is not set");
      throw new Error("JWT_SECRET is required");
    }
    return secret;
  },

  get mongoUri() {
    const uri = env["MONGODB_URI"];
    if (!uri) {
      logger.fatal("MONGODB_URI environment variable is not set");
      throw new Error("MONGODB_URI is required");
    }
    return uri;
  },

  port: parseInt(env["PORT"] ?? "3000", 10),
};
