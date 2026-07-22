import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { isDevelopment } from "../config/env.js";
import { logger } from "../common/utils/logger.js";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the full error for debugging
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    requestId: req.id,
  });

  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred";

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as any).status === 400 &&
    "body" in error
  ) {
    statusCode = 400;
    code = "BAD_REQUEST";
    message = "Malformed JSON payload";
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(isDevelopment && { stack: error.stack, details: error.message }),
    },
    requestId: req.id,
  });
};
