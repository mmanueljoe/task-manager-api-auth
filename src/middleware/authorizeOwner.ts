import { type Response, type NextFunction } from "express";
import { AppError } from "../types/types.js";
import { TaskModel } from "../models/task.model.js";

interface RequestWithTask {
  user?: { userId: string; role: string };
  task?: InstanceType<typeof TaskModel>;
}

export const authorizeOwner = (
  req: RequestWithTask,
  _res: Response,
  next: NextFunction
) => {
  const resource = req.task;
  const userId = req.user?.["userId"];

  if (!resource?.createdBy) {
    return next(new AppError("Resource not found", 404));
  }

  if (resource.createdBy.toString() !== userId) {
    return next(
      new AppError("You are not authorized to access this resource", 403)
    );
  }

  next();
};
