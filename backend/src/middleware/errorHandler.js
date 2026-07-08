import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred";

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    statusCode = 400;
    code = "BAD_REQUEST";
    message = "Malformed JSON payload";
  }

  res.status(statusCode).json({
    error: { code, message },
    requestId: req.id,
  });
};
