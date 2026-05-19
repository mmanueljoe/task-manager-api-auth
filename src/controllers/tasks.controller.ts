import { type Request, type Response, type NextFunction } from "express";
import { TaskModel } from "../models/task.model.js";
import { getTaskOrFail } from "../utils/getTaskOrFail.js";
import { success, error } from "../utils/response.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../schemas/task.schema.js";

const getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { completed, priority, sort, order, page, limit } = req.query;

    const filter: Record<string, unknown> = {};

    const pageNum: number = page ? Number.parseInt(page as string) : 1;

    const limitNum: number = limit ? Number.parseInt(limit as string) : 10;

    const skip: number = (pageNum - 1) * limitNum;

    if (completed !== undefined) filter["completed"] = completed === "true";

    if (priority !== undefined) filter["priority"] = priority;

    filter["createdBy"] = req.user?.["userId"];

    const sortObj: Record<string, 1 | -1> = sort
      ? { [sort as string]: order === "desc" ? -1 : 1 }
      : {};

    const [tasks, total] = await Promise.all([
      TaskModel.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      TaskModel.countDocuments(filter),
    ]);

    return success(res, tasks, undefined, 200, {
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    return next(err);
  }
};

const getAllTasksAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tasks = await TaskModel.find();
    return success(res, tasks);
  } catch (err) {
    return next(err);
  }
};

const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;
    const task = await getTaskOrFail(id);
    return success(res, task);
  } catch (err) {
    return next(err);
  }
};

const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskData = req.body as CreateTaskInput;

    const task = await TaskModel.create({
      ...taskData,
      createdBy: req.user?.["userId"] ?? "",
    });

    return success(res, task, "Task created successfully", 201);
  } catch (err) {
    return next(err);
  }
};

const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;
    const taskData = req.body as UpdateTaskInput;

    const task = await getTaskOrFail(id);

    if (task.createdBy.toString() !== req.user?.["userId"]) {
      return error(res, "You are not authorized to update this task", 403);
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(id, taskData, {
      new: true,
    });

    return success(res, updatedTask, "Task updated successfully");
  } catch (err) {
    return next(err);
  }
};

const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

    const task = await getTaskOrFail(id);

    if (task.createdBy.toString() !== req.user?.["userId"]) {
      return error(res, "You are not authorized to delete this task", 403);
    }

    await TaskModel.findByIdAndDelete(id);

    return success(res, null, "Task deleted successfully");
  } catch (err) {
    return next(err);
  }
};

export {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllTasksAdmin,
};
