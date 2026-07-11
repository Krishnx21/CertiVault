import { Router } from "express";
import { Document } from "../documents/document.model.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const [total, verified, pending, storageResult] = await Promise.all([
      Document.countDocuments(),
      Document.countDocuments({ status: "verified" }),
      Document.countDocuments({ status: "pending" }),
      Document.aggregate([{ $group: { _id: null, total: { $sum: "$size" } } }]),
    ]);

    res.json({
      data: {
        total,
        verified,
        pending,
        storageBytes: storageResult[0]?.total ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});
