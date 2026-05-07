import mongoose from "mongoose";
import { type Request, type Response, type NextFunction } from "express";
import { TaskModel } from "../models/task.model.js";

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

    return res.status(200).json({
      tasks,
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
  next: NextFunction,
) => {
  try {
    const tasks = await TaskModel.find();

    return res.status(200).json(tasks);
  } catch (err) {
    return next(err);
  }
};

const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
};

const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newTask = req.body;

    if (!newTask.title || !newTask.description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    const task = await TaskModel.create({
      ...newTask,
      createdBy: req.user?.["userId"],
    });

    return res.status(201).json({ task, message: "Task created successfully" });
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  }
};

const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const newTask = req.body;

    if (!Object.keys(newTask).length)
      return res.status(400).json({ message: "No fields to update" });

    const task = await TaskModel.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.createdBy.toString() !== req.user?.["userId"]) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this task" });
    }

    await TaskModel.findByIdAndUpdate(id, newTask, { new: true });

    return res.status(200).json({ message: "Task updated successfully" });
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  }
};

const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const task = await TaskModel.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.createdBy.toString() !== req.user?.["userId"]) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this task" });
    }

    await TaskModel.findByIdAndDelete(id);

    return res.status(200).json({ message: "Task deleted successfully" });
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
