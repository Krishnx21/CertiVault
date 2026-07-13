import { Router } from "express";
import { Document } from "../documents/document.model.js";
import { eventBus } from "../../utils/eventBus.js";

export const dashboardRouter = Router();

// In-memory decoupled state
let summaryState = {
  total: 0,
  verified: 0,
  pending: 0,
  storageBytes: 0,
};

let initialized = false;

// Initialize state asynchronously once
const initDashboardState = async () => {
  if (initialized) return;
  const [total, verified, pending, storageResult] = await Promise.all([
    Document.countDocuments(),
    Document.countDocuments({ status: "verified" }),
    Document.countDocuments({ status: "pending" }),
    Document.aggregate([{ $group: { _id: null, total: { $sum: "$size" } } }]),
  ]);

  summaryState = {
    total,
    verified,
    pending,
    storageBytes: storageResult[0]?.total ?? 0,
  };
  initialized = true;
};

// Start initialization immediately
initDashboardState().catch(console.error);

// Subscribe to events to update state without querying DB
eventBus.on("documentCreated", (doc) => {
  summaryState.total += 1;
  summaryState.storageBytes += doc.size || 0;
  if (doc.status === "verified") summaryState.verified += 1;
  if (doc.status === "pending") summaryState.pending += 1;
});

eventBus.on("documentUpdated", (doc) => {
  // If we wanted to accurately track changes in size or status, we would need the previous state of the document.
  // For MVP architecture decoupling, we assume simple re-fetch or best-effort update on status change.
  // To keep it simple, we'll re-init the state completely on update or delete to stay accurate without complex delta logic.
  initialized = false;
  initDashboardState().catch(console.error);
});

eventBus.on("documentDeleted", (id) => {
  // Same as update, re-initialize to ensure accuracy
  initialized = false;
  initDashboardState().catch(console.error);
});

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    if (!initialized) {
      await initDashboardState();
    }

    res.json({
      data: summaryState,
    });
  } catch (err) {
    next(err);
  }
});
