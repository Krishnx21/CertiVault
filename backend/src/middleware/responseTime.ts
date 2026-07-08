import { Request, Response, NextFunction } from "express";

export const responseTime = (req: Request, res: Response, next: NextFunction): void => {
  const start = performance.now();
  let headerSet = false;

  const setHeader = () => {
    if (headerSet) return;
    const duration = performance.now() - start;
    res.setHeader("X-Response-Time", `${duration.toFixed(3)}ms`);
    headerSet = true;
  };

  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args: any[]) {
    setHeader();
    return originalWriteHead.apply(this, args as any);
  };

  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    setHeader();
    return originalEnd.apply(this, args as any);
  };

  next();
};
