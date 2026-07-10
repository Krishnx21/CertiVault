import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { UserModel } from "../modules/auth/auth.model.js";
import { getEnv } from "../config/env.js";

const env = getEnv();

interface JwtPayload {
  id: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "UNAUTHORIZED", "No token provided");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "No token provided");
    }

    try {
      const decoded = jsonwebtoken.verify(token, env.jwtSecret) as JwtPayload;
      const user = await UserModel.findById(decoded.id).select("-password");

      if (!user) {
        throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
      }

      req.user = user;
      next();
    } catch (err) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired token");
    }
  } catch (error) {
    next(error);
  }
};
