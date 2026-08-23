/**
 * Shares Controller
 * Thin HTTP layer — validates input, calls the service, sends the response.
 */

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { createShareSchema, accessShareSchema } from "./share.validation.js";
import {
  createShare,
  listUserShares,
  revokeShare,
  getPublicShare,
  accessShare,
  getShareFile,
} from "./share.service.js";

// ── Owner endpoints (behind protect) ──────────────────────────────────────────

/** POST /api/shares — create a view-only share link for one document. */
export async function createShareController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    const ownerName = (req as any).user?.name as string | undefined;
    const ownerEmail = (req as any).user?.email as string | undefined;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const input = createShareSchema.parse(req.body);
    const share = await createShare(userId, ownerName, ownerEmail, input);

    res.status(201).json({ success: true, data: share });
  } catch (err) {
    next(err);
  }
}

/** GET /api/shares — list the authenticated owner's active share links. */
export async function listSharesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));

    const data = await listUserShares(userId, page, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/shares/:shareId — revoke a share link (owner-scoped). */
export async function revokeShareController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const { shareId } = req.params;
    await revokeShare(userId, String(shareId));

    res.json({ success: true, message: "Share link revoked" });
  } catch (err) {
    next(err);
  }
}

// ── Public endpoints (no auth) ────────────────────────────────────────────────

/** GET /api/shares/public/:token — metadata for the landing page (no bytes). */
export async function getPublicShareController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const data = await getPublicShare(String(token));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /api/shares/public/:token/access — verify password, mint view token. */
export async function accessShareController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const { password } = accessShareSchema.parse(req.body ?? {});
    const userAgent = req.headers["user-agent"];

    const result = await accessShare(
      String(token),
      password,
      req.ip,
      typeof userAgent === "string" ? userAgent : undefined
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shares/public/:token/file — stream bytes INLINE for view-only render.
 * View token comes from the Authorization: Bearer header (preferred) or ?vt=.
 */
export async function getShareFileController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;

    const authHeader = req.headers.authorization;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const queryToken = typeof req.query.vt === "string" ? req.query.vt : undefined;
    const viewToken = bearer || queryToken;

    if (!viewToken) {
      return next(new ApiError(401, "VIEW_TOKEN_REQUIRED", "Missing view token"));
    }

    const { buffer, mimeType, fileName } = await getShareFile(String(token), viewToken);

    // View-only, inline serving — no `attachment` disposition means no download
    // prompt, and no presigned URL is ever exposed to the client.
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
