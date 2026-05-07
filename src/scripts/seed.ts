import mongoose from "mongoose";
import { TaskModel } from "../models/task.model.js";
import { connectDB } from "../config/db.js";
import { configDotenv } from "dotenv";

configDotenv();

const seed = async () => {
  await connectDB();

  await TaskModel.insertMany([
    {
      title: "Buy groceries",
      description: "Milk, eggs, bread, and vegetables",
      priority: "low",
    },
    {
      title: "Fix login bug",
      description: "Users are unable to log in with Google OAuth",
      priority: "high",
    },
    {
      title: "Write unit tests",
      description: "Cover all controller functions with tests",
      priority: "medium",
    },
    {
      title: "Update README",
      description: "Document the new filtering and pagination endpoints",
      priority: "low",
    },
    {
      title: "Review pull requests",
      description: "Review and merge 3 open PRs on GitHub",
      priority: "medium",
    },
    {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated deployment",
      priority: "high",
    },
    {
      title: "Refactor auth module",
      description: "Clean up the authentication middleware",
      priority: "medium",
    },
    {
      title: "Deploy to Render",
      description: "Deploy the task manager API to Render hosting",
      priority: "high",
      completed: true,
    },
    {
      title: "Schedule team meeting",
      description: "Weekly sync with the backend team",
      priority: "low",
      completed: true,
    },
    {
      title: "Optimize database queries",
      description: "Add indexes to frequently queried fields",
      priority: "medium",
    },
  ]);

  await mongoose.disconnect();
};

seed();
