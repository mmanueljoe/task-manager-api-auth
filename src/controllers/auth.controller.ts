import { type Response, type Request, type NextFunction } from "express";
import { UserModel } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { config, logger } from "../config/index.js";
import { success, error } from "../utils/response.js";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema.js";

const SALT_ROUNDS = 10;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body as RegisterInput;

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return error(res, "User already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    return success(
      res,
      {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      "User created successfully",
      201
    );
  } catch (err) {
    return next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return error(res, "Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return error(res, "Invalid credentials", 401);
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    return success(res, { token }, "Login successful");
  } catch (err) {
    logger.error({ err }, "Login error");
    return next(err);
  }
};
