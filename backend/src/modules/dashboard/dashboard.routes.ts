import { Router, Request, Response } from "express";
import { documentStore } from "../documents/document.store.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req: Request, res: Response) => {
  const summary = await documentStore.getSummary();
  if ('_id' in summary) {
    delete summary._id;
  }
  res.json({
    data: summary,
  });
});
