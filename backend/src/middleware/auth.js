import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { getEnv } from "../config/env.js";

export const authenticate = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "UNAUTHORIZED", "Missing or invalid authorization header"));
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, getEnv().jwtSecret);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "TOKEN_EXPIRED", "Token has expired"));
    }
    return next(new ApiError(401, "UNAUTHORIZED", "Invalid token"));
  }
};
