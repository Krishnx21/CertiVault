import express from "express";
import cors from "cors";
import { getEnv } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requestId } from "./middleware/requestId.js";
import { responseTime } from "./middleware/responseTime.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { documentRouter } from "./modules/documents/document.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { infoRouter } from "./modules/info/info.routes.js";
import { shareLinkRouter, publicShareRouter } from "./modules/share/share.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export const createApp = () => {
  const app = express();
  const env = getEnv();

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(responseTime);
  app.use(cors({ origin: env.frontendOrigin }));
  app.use(express.json({ limit: "50mb" }));
  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api", infoRouter);
  app.use("/api/documents", documentRouter);
  app.use("/api/documents/:id/share-links", shareLinkRouter);
  app.use("/api/share", publicShareRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
