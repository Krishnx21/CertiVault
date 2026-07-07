/**
 * asyncHandler.js — Wraps async Express route handlers.
 *
 * Catches any rejected promise or thrown error and forwards it to
 * Express's next() function, ensuring errors reach the centralised
 * error handler without needing try/catch in every controller.
 *
 * Usage:
 *   router.get('/documents', asyncHandler(documentController.list));
 *
 * @param {Function} fn - An async Express route handler or middleware.
 * @returns {Function} A standard Express middleware function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
