/**
 * Common utilities export file
 */

export * from "./logger.js";

/**
 * Generate a unique ID with prefix
 */
export const generateId = (prefix: string = ""): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
};

/**
 * Generate a secure random token
 */
export const generateToken = (length: number = 32): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Sanitize user object for API response
 * Removes sensitive fields
 */
export const sanitizeUser = <T extends { passwordHash?: string; password?: string; [key: string]: unknown }>(user: T): Omit<T, "passwordHash" | "password"> => {
  const { passwordHash, password, ...sanitized } = user as T & { passwordHash?: string; password?: string };
  return sanitized;
};

/**
 * Calculate SHA-256 hash of data
 */
export const sha256 = async (data: Buffer | string): Promise<string> => {
  const crypto = await import("crypto");
  const buffer = typeof data === "string" ? Buffer.from(data) : data;
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Parse pagination query parameters
 */
export const parsePagination = (
  page?: string | number,
  limit?: string | number,
  sort?: string,
  order?: string
) => {
  const parsedPage = Math.max(1, parseInt(String(page || 1), 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || 20), 10)));
  const parsedSort = sort || "createdAt";
  const parsedOrder = order === "asc" ? 1 : -1;
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    sort: parsedSort,
    order: parsedOrder,
  };
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: Record<string, unknown>): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Pick specific fields from an object
 */
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
};

/**
 * Omit specific fields from an object
 */
export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
};

/**
 * Retry a function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await sleep(delay);
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Slugify a string
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Escape HTML special characters
 */
export const escapeHtml = (text: string): string => {
  const amp = String.fromCharCode(38) + "amp;";
  const lt = String.fromCharCode(60) + "lt;";
  const gt = String.fromCharCode(62) + "gt;";
  const quot = String.fromCharCode(34) + "quot;";
  const apos = "&#039;";
  
  return text
    .replace(/&/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot)
    .replace(/'/g, apos);
};

/**
 * Parse user agent string
 */
export const parseUserAgent = (userAgent: string): { browser?: string; os?: string; device?: string } => {
  const result: { browser?: string; os?: string; device?: string } = {};
  
  if (/Chrome/i.test(userAgent)) result.browser = "Chrome";
  else if (/Firefox/i.test(userAgent)) result.browser = "Firefox";
  else if (/Safari/i.test(userAgent)) result.browser = "Safari";
  else if (/Edge/i.test(userAgent)) result.browser = "Edge";
  else if (/MSIE|Trident/i.test(userAgent)) result.browser = "Internet Explorer";
  
  if (/Windows/i.test(userAgent)) result.os = "Windows";
  else if (/Mac OS X/i.test(userAgent)) result.os = "macOS";
  else if (/Linux/i.test(userAgent)) result.os = "Linux";
  else if (/Android/i.test(userAgent)) result.os = "Android";
  else if (/iOS|iPhone|iPad|iPod/i.test(userAgent)) result.os = "iOS";
  
  if (/Mobile|Android|iOS/i.test(userAgent)) result.device = "mobile";
  else if (/Tablet|iPad/i.test(userAgent)) result.device = "tablet";
  else result.device = "desktop";
  
  return result;
};

/**
 * Get client IP from request
 */
export const getClientIp = (req: { ip?: string; headers?: Record<string, string | undefined> }): string => {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "unknown";
};