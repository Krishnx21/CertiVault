import { Router, Request, Response } from "express";
import { documentStore } from "../documents/document.store.js";
import { LRUCache } from "../../utils/cache.js";

export const dashboardRouter = Router();

interface DashboardSummary {
  total: number;
  verified: number;
  pending: number;
  storageBytes: number;
}

const summaryCache = new LRUCache<DashboardSummary>(1, 30_000); // 30s TTL
const SUMMARY_CACHE_KEY = "dashboard:summary";

dashboardRouter.get("/summary", async (_req: Request, res: Response) => {
  const cached = summaryCache.get(SUMMARY_CACHE_KEY);
  if (cached) {
    return res.json({ data: cached });
  }

  const documents = await documentStore.all();
  const summary: DashboardSummary = {
    total: documents.length,
    verified: documents.filter(({ status }) => status === "verified").length,
    pending: documents.filter(({ status }) => status === "pending").length,
    storageBytes: documents.reduce((total, document) => total + document.size, 0),
  };

  summaryCache.set(SUMMARY_CACHE_KEY, summary);
  res.json({ data: summary });
});

