import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message:
      "Too many registration attempts, please try again after 15 minutes",
  },
});

authRouter.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  register
);

authRouter.post("/login", loginLimiter, validate(loginSchema), login);

export default authRouter;
