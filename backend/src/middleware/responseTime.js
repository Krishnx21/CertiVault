/**
 * Response-time middleware.
 *
 * Records the wall-clock start time using process.hrtime.bigint() for
 * nanosecond-precision timing. When the response is flushed, calculates
 * the elapsed duration in whole milliseconds and injects it as the
 * X-Response-Time header by wrapping res.end — the single guaranteed
 * point where every response is written.
 *
 * res.end is preferred over the "finish" event because "finish" fires
 * after headers are already flushed, making res.setHeader a no-op at
 * that point.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const responseTime = (req, res, next) => {
  const start = process.hrtime.bigint();

  const originalEnd = res.end;
  res.end = function (...args) {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs / 1_000_000n);
    res.setHeader("X-Response-Time", `${durationMs}ms`);
    return originalEnd.apply(this, args);
  };

  next();
};
