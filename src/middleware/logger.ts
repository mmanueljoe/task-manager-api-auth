import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../config/index.js";

export const logRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logger.info(
    { method: req.method, path: req.path, ip: req.ip },
    "incoming request"
  );
  next();
};
