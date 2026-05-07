import { type Request, type Response } from "express";


// 404 handler
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
};
