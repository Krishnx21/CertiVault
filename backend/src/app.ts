/**
 * CertiVault Express Application
 * Main application configuration and middleware setup
 */

import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
// express-mongo-sanitize is incompatible with Express 5.0
// We handle NoSQL injection through input validation instead
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { getEnv, isDevelopment, isProduction } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requestId } from "./middleware/requestId.js";
import { responseTime } from "./middleware/responseTime.js";
import { httpLogger } from "./common/utils/logger.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { infoRouter } from "./modules/info/info.routes.js";
import { documentRouter } from "./modules/documents/document.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { verificationRouter } from "./modules/verifications/verification.routes.js";

const env = getEnv();

/**
 * Create and configure Express application
 */
export const createApp = (): Express => {
  const app = express();

  // ============================================
  // TRUST PROXY (for rate limiting behind reverse proxy)
  // ============================================
  if (env.TRUST_PROXY || isProduction) {
    app.set("trust proxy", 1);
  }

  // ============================================
  // SECURITY HEADERS
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: isDevelopment
        ? false
        : {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'", "https://api.certi-vault.com"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          },
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    })
  );

  // ============================================
  // CORS CONFIGURATION
  // ============================================
  const allowedOrigins = Array.from(
    new Set([
      env.FRONTEND_ORIGIN,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      ...(isDevelopment ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
    ])
  ).filter(Boolean);

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID", "X-Response-Time"],
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 hours
  };

  app.use(cors(corsOptions));

  // ============================================
  // REQUEST IDENTIFICATION & LOGGING
  // ============================================
  app.use(requestId);
  app.use(responseTime);
  app.use(httpLogger);

  // ============================================
  // BODY PARSING
  // ============================================
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // ============================================
  // COMPRESSION
  // ============================================
  app.use(compression());

  // ============================================
  // DATA SANITIZATION
  // ============================================
  // NoSQL injection prevention is handled through input validation
  // and Mongoose's built-in protections

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // ============================================
  // RATE LIMITING
  // ============================================
  // General API rate limiter
  const generalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: {
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later.",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", generalLimiter);

  // Stricter rate limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message: "Too many authentication attempts, please try again later.",
      },
    },
    skipSuccessfulRequests: false,
  });

  app.use("/api/auth", authLimiter);

  // ============================================
  // STATIC FILES (for production)
  // ============================================
  if (isProduction) {
    app.use(express.static("public"));
  }

  // ============================================
  // API ROUTES
  // ============================================
  app.use("/health", healthRouter);
  app.use("/api", infoRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/documents", documentRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/verifications", verificationRouter);

  // ============================================
  // ERROR HANDLING
  // ============================================
  app.use(notFound);
  app.use(errorHandler);

  return app;
};