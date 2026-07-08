import { ApiError } from "../utils/ApiError.js";

export const notFound = (req, _res, next) => {
  next(
    new ApiError(404, "ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} was not found`)
  );
};
