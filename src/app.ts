import express from "express";
import { configDotenv } from "dotenv";
import taskRouter from "./routes/tasks.routes.js";
import authRouter from "./routes/auth.routes.js";
import { logRequest } from "./middleware/logger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectDB } from "./config/db.js";
import { logger, config } from "./config/index.js";

configDotenv();

const app: express.Application = express();

app.use(express.json());
app.use(logRequest);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/tasks", taskRouter);
app.use("/api/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

try {
  await connectDB();
  app.listen(config.port, () => {
    logger.info({ port: config.port }, "Server is running");
  });
} catch (err) {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
}
