import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { UserModel } from "./auth.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { getEnv } from "../../config/env.js";

const env = getEnv();

const generateToken = (userId: string): string => {
  return jsonwebtoken.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpires as any,
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, "BAD_REQUEST", "Name, email, and password are required");
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "BAD_REQUEST", "User with this email already exists");
    }

    const user = await UserModel.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "BAD_REQUEST", "Email and password are required");
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};
