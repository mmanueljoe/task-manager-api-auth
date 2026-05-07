import{ type Request, type Response, type NextFunction } from "express";


export const logRequest = (req: Request, _res: Response, next: NextFunction): void => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  next();
}
