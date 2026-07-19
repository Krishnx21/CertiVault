/**
 * Structured logging utility using Winston
 * Provides consistent, JSON-formatted logs for production observability
 */

import winston from "winston";
import { getEnv, isDevelopment, isTest, isProduction } from "../../config/env.js";

const env = getEnv();

// Log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log level colors for development
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add colors to winston
winston.addColors(colors);

interface LogInfo {
  timestamp?: string;
  level: string;
  message: string;
  [key: string]: unknown;
}

// Format for production (JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Format for development (colored console)
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info as LogInfo;
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add request ID if present
    if (meta.requestId) {
      msg += ` [${meta.requestId}]`;
    }
    
    // Add user ID if present
    if (meta.userId) {
      msg += ` (user:${meta.userId})`;
    }
    
    // Add duration if present
    if (meta.durationMs !== undefined) {
      msg += ` (${meta.durationMs}ms)`;
    }
    
    // Add additional metadata
    const additionalMeta = Object.keys(meta).filter(
      (key: string) => !["requestId", "userId", "durationMs"].includes(key)
    );
    
    if (additionalMeta.length > 0) {
      const metaStr = additionalMeta.map((key: string) => `${key}=${meta[key]}`).join(" ");
      msg += ` {${metaStr}}`;
    }
    
    return msg;
  })
);

// Create the logger instance
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels: logLevels,
  handleExceptions: !isTest,
  handleRejections: !isTest,
  
  // Different transports for different environments
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: isDevelopment ? developmentFormat : productionFormat,
    }),
    
    // File transport for errors in production
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  
  // Don't log in test environment unless there's an error
  silent: isTest,
});

// Create a child logger for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// HTTP request logger middleware
export const httpLogger = (req: unknown, res: unknown, next: () => void) => {
  const start = Date.now();
  
  // Cast to proper types
  const expressReq = req as {
    method: string;
    url: string;
    headers: Record<string, string>;
    ip: string;
    user?: { userId: string; email: string };
    requestId?: string;
  };
  
  const expressRes = res as {
    statusCode: number;
    on: (event: string, callback: () => void) => void;
  };
  
  expressRes.on("finish", () => {
    const durationMs = Date.now() - start;
    
    logger.log({
      level: "http",
      message: `${expressReq.method} ${expressReq.url}`,
      requestId: expressReq.requestId,
      userId: expressReq.user?.userId,
      statusCode: expressRes.statusCode,
      durationMs,
      ip: expressReq.ip,
      userAgent: expressReq.headers["user-agent"],
    });
  });
  
  next();
};

// Audit logger for security-sensitive events
export const auditLogger = (
  action: string,
  data: {
    actorId: string;
    actorEmail: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }
) => {
  logger.log({
    level: "info",
    message: `AUDIT: ${action}`,
    audit: true,
    action,
    ...data,
  });
};

// Error logger with context
export const errorLogger = (
  error: Error,
  context: {
    requestId?: string;
    userId?: string;
    operation?: string;
    metadata?: Record<string, unknown>;
  } = {}
) => {
  logger.log({
    level: "error",
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export { logger };
export default logger;