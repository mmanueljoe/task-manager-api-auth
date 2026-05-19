import { type Request, type Response, type NextFunction } from "express";
import { getTaskOrFail } from "../utils/getTaskOrFail.js";
import { TaskModel } from "../models/task.model.js";

interface RequestWithTask extends Request {
  task?: InstanceType<typeof TaskModel>;
}

export const attachTask = async (
  req: RequestWithTask,
  _res: Response,
  next: NextFunction
) => {
  const id = req.params["id"] as string;
  const task = await getTaskOrFail(id);
  req.task = task;
  next();
};
