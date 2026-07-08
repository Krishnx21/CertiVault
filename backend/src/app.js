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

export const createApp = () => {
  const app = express();
  const env = getEnv();

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(responseTime);
  app.use(cors({ origin: env.frontendOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/health", healthRouter);
  app.use("/api", infoRouter);
  app.use("/api/documents", documentRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
