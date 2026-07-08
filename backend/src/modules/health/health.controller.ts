import { Request, Response } from "express";

export const getLiveness = (_req: Request, res: Response): void => {
  res.status(200).json({ status: "ok" });
};

export const getReadiness = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ready",
    checks: {},
  });
};
