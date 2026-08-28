import { Router } from "express";
import { getDashboardSummary, invalidateDashboardCache } from "./dashboard.controller.js";
import { eventBus } from "../../utils/eventBus.js";

export const dashboardRouter = Router();

// Subscribe to events to invalidate cache
eventBus.on("documentCreated", () => {
  invalidateDashboardCache().catch(console.error);
});

eventBus.on("documentDeleted", () => {
  invalidateDashboardCache().catch(console.error);
});

eventBus.on("documentUpdated", () => {
  invalidateDashboardCache().catch(console.error);
});

dashboardRouter.get("/summary", getDashboardSummary);
