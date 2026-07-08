import { Router } from "express";

export const infoRouter = Router();

infoRouter.get("/", (_req, res) => {
  res.status(200).json({
    service: "CertiVault API",
    status: "running",
    links: {
      liveness: "/health/live",
    },
  });
});
