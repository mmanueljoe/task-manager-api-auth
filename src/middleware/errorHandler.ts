import { type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../types/types.js";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  } else if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: err.message });
  } else if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown })["code"] === 11000
  ) {
    return res.status(409).json({ message: "Duplicate key error" });
  }
  
  if(err instanceof Error) console.error(err.stack);

  return res.status(500).json({ message: "Internal server error" });
};
