import { Request, Response } from "express";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { checkRedisHealth } from "../../config/redis.js"; // UPDATED

let version = "0.0.0";
try {
  const pkg = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
  version = pkg.version;
} catch {
  // fallback if version cannot be read
}

export const getLiveness = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    version,
    uptimeSeconds: Math.floor(process.uptime()),
  });
};

// UPDATED — async readiness check includes MongoDB + Redis status
export const getReadiness = async (_req: Request, res: Response): Promise<void> => {
  const mongoState = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting
  const mongoStatus: "healthy" | "unhealthy" =
    mongoState === 1 || mongoState === 2 ? "healthy" : "unhealthy";

  const redisStatus = await checkRedisHealth();

  const allHealthy =
    mongoStatus === "healthy" &&
    (redisStatus === "healthy" || redisStatus === "disabled");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ready" : "degraded",
    version,
    checks: {
      mongo: mongoStatus,
      redis: redisStatus,
    },
  });
};
