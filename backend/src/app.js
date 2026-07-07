/**
 * app.js — Express application configuration.
 *
 * Sets up all global middleware in the correct order and mounts route modules.
 * Does NOT start the HTTP server (that is server.js's responsibility).
 *
 * Middleware order:
 *  1. trust proxy
 *  2. Helmet security headers
 *  3. CORS
 *  4. JSON / body-size limits
 *  5. Cookie parser
 *  6. Request logging
 *  7. Health routes (no auth, no rate-limit)
 *  8. API routes
 *  9. 404 handler
 * 10. Centralised error handler
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

import env from './config/env.js';
import logger from './utils/logger.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// ── 1. Trust proxy (required when deployed behind NGINX / load balancer) ──
app.set('trust proxy', 1);

// ── 2. Security headers ───────────────────────────────────────────────────
app.use(helmet());

// ── 3. CORS ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── 4. Body parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── 5. Cookie parser ──────────────────────────────────────────────────────
app.use(cookieParser());

// ── 6. Request logging ────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.originalUrl }, 'Incoming request');
  next();
});

// ── 7. General rate limiter ───────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});

app.use('/api', generalLimiter);

// ── 8. Health endpoints ───────────────────────────────────────────────────
app.get('/api/v1/health/live', (_req, res) => {
  res.status(200).json({ data: { status: 'ok' } });
});

// ── 9. API routes (to be expanded in Phase 1) ─────────────────────────────
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/documents', documentRoutes);

// ── 10. 404 handler ───────────────────────────────────────────────────────
app.use(notFound);

// ── 11. Centralised error handler ─────────────────────────────────────────
app.use(errorHandler);

export default app;
