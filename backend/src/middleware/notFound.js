/**
 * notFound.js — 404 catch-all middleware.
 *
 * Registered after all routes. Returns a consistent NOT_FOUND error
 * for any request that did not match a defined route, forwarding it
 * to the centralised error handler.
 */

import { ApiError } from '../utils/ApiError.js';

const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};

export default notFound;
