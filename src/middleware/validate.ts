import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(", ");
      res.status(400).json({ message: errors });
      return;
    }
    req.body = result.data;
    next();
  };
};
