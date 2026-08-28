import { Document } from "../documents/document.model.js";
import { cache } from "../../utils/cache.js";

const DASHBOARD_SUMMARY_CACHE_KEY = "dashboard:summary";
const CACHE_TTL_SECONDS = 300; // 5 minutes

export const getDashboardSummary = async (_req, res, next) => {
  try {
    // 1. Check Cache
    const cachedSummary = await cache.get(DASHBOARD_SUMMARY_CACHE_KEY);
    if (cachedSummary) {
      return res.json({ data: cachedSummary });
    }

    // 2. Cache Miss - Query MongoDB
    const [total, verified, pending, storageResult] = await Promise.all([
      Document.countDocuments(),
      Document.countDocuments({ status: "verified" }),
      Document.countDocuments({ status: "pending" }),
      Document.aggregate([{ $group: { _id: null, total: { $sum: "$size" } } }]),
    ]);

    const summaryState = {
      total,
      verified,
      pending,
      storageBytes: storageResult[0]?.total ?? 0,
    };

    // 3. Store in Cache
    await cache.set(DASHBOARD_SUMMARY_CACHE_KEY, summaryState, CACHE_TTL_SECONDS);

    return res.json({ data: summaryState });
  } catch (err) {
    next(err);
  }
};

export const invalidateDashboardCache = async () => {
  try {
    await cache.del(DASHBOARD_SUMMARY_CACHE_KEY);
  } catch (error) {
    console.error("Error invalidating dashboard cache:", error);
  }
};
