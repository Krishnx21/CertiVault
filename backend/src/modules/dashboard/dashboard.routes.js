import { Router } from "express";
import { documentStore } from "../documents/document.store.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", (_req, res) => {
  const documents = documentStore.all();
  res.json({
    data: {
      total: documents.length,
      verified: documents.filter(({ status }) => status === "verified").length,
      pending: documents.filter(({ status }) => status === "pending").length,
      storageBytes: documents.reduce((total, document) => total + document.size, 0),
    },
  });
});
