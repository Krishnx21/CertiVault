/**
 * Vault Controller
 * Thin HTTP layer — validates input, calls service, sends response.
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/ApiError.js";
import {
  inviteMember,
  listMembers,
  changeMemberRole,
  removeMember,
  getMyInvites,
  acceptInvite,
  declineInvite,
  leaveVault,
  getVaultsSharedWithMe,
  resendInvite,
} from "./vault.service.js";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  memberEmail: z.string().email("Invalid email address"),
  role: z.enum(["viewer", "editor"]),
});

const changeRoleSchema = z.object({
  role: z.enum(["viewer", "editor"]),
});

// ─── Owner endpoints ──────────────────────────────────────────────────────────

/**
 * POST /api/vault/members
 * Invite someone to the authenticated user's vault.
 */
export async function inviteMemberController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    const ownerName = (req as any).user?.name as string;
    const ownerEmail = (req as any).user?.email as string;

    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const { memberEmail, role } = inviteSchema.parse(req.body);

    const member = await inviteMember(userId, ownerName, ownerEmail, memberEmail, role);

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/vault/members
 * List all members of the authenticated user's vault.
 */
export async function listMembersController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const members = await listMembers(userId);

    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/vault/members/:memberId
 * Change the role of an active vault member.
 */
export async function changeMemberRoleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const { memberId } = req.params;
    const { role } = changeRoleSchema.parse(req.body);

    const updated = await changeMemberRole(userId, String(memberId), role);

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/vault/members/:memberId
 * Remove a member from the vault (owner action).
 */
export async function removeMemberController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const { memberId } = req.params;

    await removeMember(userId, String(memberId));

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/vault/members/:memberId/resend
 * Resend invite email for a pending member.
 */
export async function resendInviteController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    const ownerName = (req as any).user?.name as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const { memberId } = req.params;

    const member = await resendInvite(userId, ownerName, String(memberId));

    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
}

// ─── Member endpoints ─────────────────────────────────────────────────────────

/**
 * GET /api/vault/invites
 * Get all pending invites sent to the authenticated user's email.
 */
export async function getMyInvitesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = (req as any).user?.email as string;
    if (!email) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const invites = await getMyInvites(email);

    res.json({ success: true, data: invites });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/vault/invites/:token/accept
 * Accept a vault invite by token.
 */
export async function acceptInviteController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    const email = (req as any).user?.email as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const { token } = req.params;

    const member = await acceptInvite(String(token), userId, email);

    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/vault/invites/:token/decline
 * Decline a vault invite by token.
 */
export async function declineInviteController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = (req as any).user?.email as string;
    if (!email) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const { token } = req.params;

    await declineInvite(String(token), email);

    res.json({ success: true, message: "Invite declined" });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/vault/access/:vaultOwnerId
 * Leave a vault (member action).
 */
export async function leaveVaultController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    const email = (req as any).user?.email as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const { vaultOwnerId } = req.params;

    await leaveVault(String(vaultOwnerId), userId, email);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/vault/shared-with-me
 * Get all vaults the authenticated user is an active member of.
 */
export async function getSharedWithMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId as string;
    if (!userId) return next(new ApiError(401, "UNAUTHORIZED", "Not authenticated"));

    const vaults = await getVaultsSharedWithMe(userId);

    res.json({ success: true, data: vaults });
  } catch (err) {
    next(err);
  }
}
