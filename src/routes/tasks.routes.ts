import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllTasksAdmin,
} from "../controllers/tasks.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const taskRouter = express.Router();

taskRouter.use(verifyToken);

taskRouter.get("/", getAllTasks);

taskRouter.get("/admin/all", authorizeRole("admin"), getAllTasksAdmin);

taskRouter.get("/:id", getTaskById);

taskRouter.post("/", createTask);

taskRouter.put("/:id", updateTask);

taskRouter.delete("/:id", deleteTask);

export default taskRouter;
