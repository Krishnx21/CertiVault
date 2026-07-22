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
import path from "path";
import { getEnv, isDevelopment, isProduction } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requestId } from "./middleware/requestId.js";
import { responseTime } from "./middleware/responseTime.js";
import { httpLogger } from "./common/utils/logger.js";
import { csrfProtection } from "./middleware/csrf.js";
import { metricsMiddleware } from "./middleware/metrics.middleware.js"; // UPDATED
import { metricsRegistry } from "./config/metrics.js"; // UPDATED
import { healthRouter } from "./modules/health/health.routes.js";
import { infoRouter } from "./modules/info/info.routes.js";
import { documentRouter } from "./modules/documents/document.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { verificationRouter } from "./modules/verifications/verification.routes.js";
import settingsRouter from "./modules/users/settings.routes.js";
import notificationRouter from "./modules/notifications/notification.routes.js";
import searchRouter from "./modules/search/search.routes.js";
import { vaultRouter } from "./modules/vault/vault.routes.js"; // UPDATED
import { createBullBoardRouter } from "./config/bullboard.js"; // UPDATED

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
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: [
            "'self'",
            "https://api.certi-vault.com",
            "http://localhost:*",
            "http://127.0.0.1:*",
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
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
      "http://localhost:5175",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
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
  // UPDATED — Prometheus HTTP metrics (before httpLogger so timing is accurate)
  app.use(metricsMiddleware);
  app.use(httpLogger);

  // ============================================
  // BODY PARSING
  // ============================================
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());
  app.use(csrfProtection);

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
  // STATIC FILES (for production and local file serving)
  // ============================================
  if (isProduction) {
    app.use(express.static("public"));
  }

  // Serve uploaded files from local storage (for development without AWS S3)
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/api/files", express.static(uploadsDir));

  // ============================================
  // API ROUTES
  // ============================================
  app.get("/", (_req, res) => {
    res.status(200).json({
      status: "success",
      message: "CertiVault API is running",
    });
  });
  // Express 5 no longer auto-handles HEAD for app.get() routes,
  // so Render's uptime probe (which sends HEAD /) would 404 without this.
  app.head("/", (_req, res) => {
    res.status(200).end();
  });
  app.use("/health", healthRouter);
  app.use("/api", infoRouter);

  // ============================================
  // PROMETHEUS METRICS ENDPOINT (UPDATED)
  // Scraped by Prometheus every 15 s.
  // Protected by IP allowlist in production via nginx — no auth here.
  // ============================================
  app.get("/metrics", async (_req, res) => {
    try {
      res.set("Content-Type", metricsRegistry.contentType);
      res.end(await metricsRegistry.metrics());
    } catch (err) {
      res.status(500).end(err instanceof Error ? err.message : "metrics error");
    }
  });
  app.use("/api/auth", authRouter);
  app.use("/api/documents", documentRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/verifications", verificationRouter);
  app.use("/api", settingsRouter);
  app.use("/api", notificationRouter);
  app.use("/api", searchRouter);
  app.use("/api/vault", vaultRouter); // UPDATED

  // ============================================
  // BULL BOARD — Queue Admin UI (UPDATED)
  // Protected by HTTP Basic Auth
  // Access: http://localhost:5000/admin/queues
  // ============================================
  const { router: bullBoardRouter, authMiddleware: bullBoardAuth } =
    createBullBoardRouter();
  app.use("/admin/queues", bullBoardAuth, bullBoardRouter);

  // Serve local files for development with proper headers
  app.use("/api/files", (req, res, next) => {
    express.static(path.join(process.cwd(), "uploads", "documents"))(req, res, (err) => {
      if (!err && res.statusCode === 200) {
        // Set proper MIME type based on file extension
        const filePath = path.join(process.cwd(), "uploads", "documents", req.path);
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.zip': 'application/zip',
        };
        if (mimeTypes[ext]) {
          res.setHeader('Content-Type', mimeTypes[ext]);
        }
        // Set Content-Disposition for download
        const filenameParam = req.query.filename as string;
        const filename = filenameParam || path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      next(err);
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  app.use(notFound);
  app.use(errorHandler);

  return app;
};