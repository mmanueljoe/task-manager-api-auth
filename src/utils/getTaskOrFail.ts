import mongoose from "mongoose";
import { TaskModel } from "../models/task.model.js";
import { AppError } from "../types/types.js";

export const getTaskOrFail = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ID", 400);
  }

  const task = await TaskModel.findById(id);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};
