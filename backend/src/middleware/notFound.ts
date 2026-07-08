import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(
    new ApiError(404, "ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} was not found`)
  );
};
