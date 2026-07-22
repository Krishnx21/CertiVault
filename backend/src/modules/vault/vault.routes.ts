/**
 * Vault Routes
 * All routes require authentication via the protect middleware.
 */

import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import {
  inviteMemberController,
  listMembersController,
  changeMemberRoleController,
  removeMemberController,
  resendInviteController,
  getMyInvitesController,
  acceptInviteController,
  declineInviteController,
  leaveVaultController,
  getSharedWithMeController,
} from "./vault.controller.js";

export const vaultRouter = Router();

vaultRouter.use(protect);

// ── Owner manages their vault ─────────────────────────────────────────────────
vaultRouter.post("/members",               inviteMemberController);
vaultRouter.get("/members",                listMembersController);
vaultRouter.patch("/members/:memberId",    changeMemberRoleController);
vaultRouter.delete("/members/:memberId",   removeMemberController);
vaultRouter.post("/members/:memberId/resend", resendInviteController);

// ── Member manages invites they received ──────────────────────────────────────
// Static paths before param paths
vaultRouter.get("/invites",                       getMyInvitesController);
vaultRouter.post("/invites/:token/accept",        acceptInviteController);
vaultRouter.post("/invites/:token/decline",       declineInviteController);
vaultRouter.delete("/access/:vaultOwnerId",       leaveVaultController);

// ── Member queries shared vaults ──────────────────────────────────────────────
vaultRouter.get("/shared-with-me",                getSharedWithMeController);
