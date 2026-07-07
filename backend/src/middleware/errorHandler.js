import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (error, req, res, _next) => {
  const isOperational = error instanceof ApiError;
  const statusCode = isOperational ? error.statusCode : 500;
  const code = isOperational ? error.code : "INTERNAL_SERVER_ERROR";
  const message = isOperational ? error.message : "An unexpected error occurred";

  res.status(statusCode).json({
    error: { code, message },
    requestId: req.id,
  });
};
