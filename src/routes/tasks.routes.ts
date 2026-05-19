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
import { attachTask } from "../middleware/attachTask.js";
import { authorizeOwner } from "../middleware/authorizeOwner.js";
import { validate } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/task.schema.js";

const taskRouter = express.Router();

taskRouter.use(verifyToken);

taskRouter.get("/", getAllTasks);

taskRouter.get("/admin/all", authorizeRole("admin"), getAllTasksAdmin);

taskRouter.get("/:id", attachTask, getTaskById);

taskRouter.post("/", validate(createTaskSchema), createTask);

taskRouter.put("/:id", attachTask, validate(updateTaskSchema), updateTask);

taskRouter.delete("/:id", attachTask, authorizeOwner, deleteTask);

export default taskRouter;
