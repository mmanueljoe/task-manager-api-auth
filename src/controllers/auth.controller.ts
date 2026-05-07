import { type Response, type Request, type NextFunction } from "express";
import { UserModel } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await UserModel.findOne({ email });

    if (user) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    return res
      .status(201)
      .json({
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        message: "User created successfully",
      });
  } catch (err) {
    return next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await UserModel.findOne({ email });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const secret = process.env["JWT_SECRET"];
    if (!secret) throw new Error("JWT_SECRET is not defined");

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      secret,
      { expiresIn: 60 * 60 * 24 * 7},
    );

    return res.status(200).json({ token, message: "Login successful" });
  } catch (err) {
    return next(err);
  }
};
