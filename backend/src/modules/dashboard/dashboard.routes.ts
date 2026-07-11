import { Router, Request, Response } from "express";
import { dashboardService } from "./dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", (_req: Request, res: Response) => {
  const stats = dashboardService.getSummary();
  res.json({
    data: stats,
  });
});

