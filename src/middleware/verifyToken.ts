import {type Response, type Request, type NextFunction} from "express";
import * as jwt from "jsonwebtoken";



export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
   try{
     const token = req.headers["authorization"]?.split(" ")[1];
    
    if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
    }

    const secret = process.env["JWT_SECRET"];
    if (!secret) throw new Error("JWT_SECRET is not defined");

    const decoded = jwt.verify(token, secret);

    req.user = decoded as {
      userId: string;
      role: string;
    };

    return next();
   }catch {
    return res.status(401).json({ message: "Invalid or expired token" });
   }
}