import express from "express";
import { configDotenv } from "dotenv";
import taskRouter from "./routes/tasks.routes.js";
import authRouter from "./routes/auth.routes.js";
import { logRequest } from "./middleware/logger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectDB } from "./config/db.js";

configDotenv();

const PORT = process.env["PORT"] ?? 3000;

const app: express.Application = express();

app.use(express.json());
app.use(logRequest);

app.use("/api/tasks", taskRouter);
app.use("/api/auth", authRouter);

// 404 handler
app.use(notFoundHandler);

// global error handler
app.use(errorHandler);


try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}


