/**
 * Simple in-memory rate limiter middleware
 * For production, consider using Redis-backed rate limiting
 */

const windowMs = 15 * 60 * 1000; // 15 minute window
const maxRequests = 100; // limit each IP to 100 requests per windowMs

const store = new Map();

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now - value.windowStart > windowMs) {
      store.delete(key);
    }
  }
}, windowMs);

// Don't let the interval prevent process exit
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"] || "unknown";
  const key = `${ip}:${req.path}`;
  const now = Date.now();

  const record = store.get(key);

  if (!record || now - record.windowStart > windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return next();
  }

  record.count++;

  if (record.count > maxRequests) {
    res.set("Retry-After", Math.ceil((record.windowStart + windowMs - now) / 1000));
    return res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    });
  }

  next();
};