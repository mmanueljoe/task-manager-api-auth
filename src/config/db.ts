import mongoose from "mongoose";
import { config, logger } from "./index.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info("Connected to database successfully");
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to database");
    process.exit(1);
  }
};
