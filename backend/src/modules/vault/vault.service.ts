/**
 * Vault Service
 * All business logic for vault member invitations and access control.
 */

import crypto from "crypto";
import { VaultMember, IVaultMember } from "./vaultMember.model.js";
import { User } from "../users/user.model.js";
import { createNotification } from "../notifications/notification.service.js";
import { queueDocumentShared, queueDocumentSharedNotif } from "../../queues/index.js";
import { getEnv } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function inviteExpiresAt(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
}

// ─── Owner: invite a member ───────────────────────────────────────────────────

export async function inviteMember(
  vaultOwnerId: string,
  ownerName: string,
  ownerEmail: string,
  memberEmail: string,
  role: "viewer" | "editor"
): Promise<IVaultMember> {
  const env = getEnv();

  // Cannot invite yourself
  if (memberEmail.toLowerCase() === ownerEmail.toLowerCase()) {
    throw new ApiError(400, "SELF_INVITE", "You cannot invite yourself to your own vault");
  }

  // Check for duplicate pending/active invite
  const existing = await VaultMember.findOne({
    vaultOwnerId,
    memberEmail: memberEmail.toLowerCase(),
  });

  if (existing) {
    if (existing.status === "pending" || existing.status === "active") {
      throw new ApiError(
        409,
        "INVITE_ALREADY_EXISTS",
        existing.status === "active"
          ? "This person already has access to your vault"
          : "An invite has already been sent to this email"
      );
    }
    // If previously revoked/declined, delete and re-invite
    await VaultMember.deleteOne({ _id: existing._id });
  }

  const inviteToken = makeToken();
  const inviteUrl = `${env.FRONTEND_ORIGIN}/vault/shared?invite=${inviteToken}`;

  const member = await VaultMember.create({
    vaultOwnerId,
    memberUserId: null,
    memberEmail: memberEmail.toLowerCase(),
    role,
    status: "pending",
    inviteToken,
    inviteExpiresAt: inviteExpiresAt(),
  });

  // Look up whether the invitee already has an account
  const recipientUser = await User.findOne({
    email: memberEmail.toLowerCase(),
    isActive: true,
  });

  // Send invite email via queue (always)
  await queueDocumentShared({
    email: memberEmail,
    recipientName: recipientUser?.name ?? "there",
    ownerName,
    role,
    inviteUrl,
  });

  // If the invitee has an account, also create an in-app notification
  if (recipientUser) {
    await queueDocumentSharedNotif({
      recipientUserId: recipientUser._id.toString(),
      ownerName,
      role,
    });
  }

  return member;
}

// ─── Owner: list members ──────────────────────────────────────────────────────

export async function listMembers(vaultOwnerId: string): Promise<{
  active: IVaultMember[];
  pending: IVaultMember[];
  declined: IVaultMember[];
}> {
  const members = await VaultMember.find({ vaultOwnerId })
    .populate("memberUserId", "name email avatar")
    .sort({ createdAt: -1 });

  return {
    active:   members.filter((m) => m.status === "active"),
    pending:  members.filter((m) => m.status === "pending"),
    declined: members.filter((m) => m.status === "declined"),
  };
}

// ─── Owner: change role ───────────────────────────────────────────────────────

export async function changeMemberRole(
  vaultOwnerId: string,
  memberId: string,
  role: "viewer" | "editor"
): Promise<IVaultMember> {
  const member = await VaultMember.findOne({ _id: memberId, vaultOwnerId });
  if (!member) {
    throw new ApiError(404, "MEMBER_NOT_FOUND", "Member not found in your vault");
  }
  if (member.status !== "active") {
    throw new ApiError(400, "MEMBER_NOT_ACTIVE", "Can only change role of active members");
  }

  member.role = role;
  await member.save();

  // Notify the member
  if (member.memberUserId) {
    const owner = await User.findById(vaultOwnerId).select("name");
    await createNotification({
      userId: member.memberUserId.toString(),
      type: "new_member",
      title: "Vault Role Updated",
      message: `Your role in ${owner?.name ?? "a"}'s vault has been changed to ${role}.`,
      data: { actionUrl: "/vault/shared" },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  return member;
}

// ─── Owner: remove a member ───────────────────────────────────────────────────

export async function removeMember(
  vaultOwnerId: string,
  memberId: string
): Promise<void> {
  const member = await VaultMember.findOne({ _id: memberId, vaultOwnerId });
  if (!member) {
    throw new ApiError(404, "MEMBER_NOT_FOUND", "Member not found in your vault");
  }

  member.status = "revoked";
  member.revokedAt = new Date();
  member.revokedBy = "owner";
  await member.save();

  // Notify the removed member
  if (member.memberUserId) {
    const owner = await User.findById(vaultOwnerId).select("name");
    await createNotification({
      userId: member.memberUserId.toString(),
      type: "share_revoked",
      title: "Vault Access Removed",
      message: `Your access to ${owner?.name ?? "a"}'s vault has been removed.`,
      data: { actionUrl: "/vault/shared" },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }
}

// ─── Member: get pending invites addressed to me ──────────────────────────────

export async function getMyInvites(
  memberEmail: string
): Promise<IVaultMember[]> {
  return VaultMember.find({
    memberEmail: memberEmail.toLowerCase(),
    status: "pending",
    inviteExpiresAt: { $gt: new Date() },
  })
    .populate("vaultOwnerId", "name email avatar")
    .sort({ invitedAt: -1 });
}

// ─── Member: accept an invite ─────────────────────────────────────────────────

export async function acceptInvite(
  token: string,
  memberUserId: string,
  memberEmail: string
): Promise<IVaultMember> {
  const member = await VaultMember.findOne({ inviteToken: token });

  if (!member) {
    throw new ApiError(404, "INVITE_NOT_FOUND", "Invite not found");
  }
  if (member.memberEmail !== memberEmail.toLowerCase()) {
    throw new ApiError(403, "INVITE_NOT_YOURS", "This invite was not sent to your email address");
  }
  if (member.status !== "pending") {
    throw new ApiError(400, "INVITE_ALREADY_USED", `Invite has already been ${member.status}`);
  }
  if (member.inviteExpiresAt < new Date()) {
    throw new ApiError(400, "INVITE_EXPIRED", "This invite has expired");
  }

  member.memberUserId = new (await import("mongoose")).default.Types.ObjectId(
    memberUserId
  );
  member.status = "active";
  member.acceptedAt = new Date();
  await member.save();

  // Notify the vault owner
  const acceptor = await User.findById(memberUserId).select("name");
  await createNotification({
    userId: member.vaultOwnerId.toString(),
    type: "share_accepted",
    title: "Vault Invite Accepted",
    message: `${acceptor?.name ?? memberEmail} accepted your vault invite.`,
    data: { memberName: acceptor?.name, memberEmail, actionUrl: "/vault/members" },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return member;
}

// ─── Member: decline an invite ────────────────────────────────────────────────

export async function declineInvite(
  token: string,
  memberEmail: string
): Promise<void> {
  const member = await VaultMember.findOne({ inviteToken: token });

  if (!member) {
    throw new ApiError(404, "INVITE_NOT_FOUND", "Invite not found");
  }
  if (member.memberEmail !== memberEmail.toLowerCase()) {
    throw new ApiError(403, "INVITE_NOT_YOURS", "This invite was not sent to your email address");
  }
  if (member.status !== "pending") {
    throw new ApiError(400, "INVITE_ALREADY_USED", `Invite has already been ${member.status}`);
  }

  member.status = "declined";
  member.declinedAt = new Date();
  await member.save();

  // Notify the vault owner
  await createNotification({
    userId: member.vaultOwnerId.toString(),
    type: "share_revoked",
    title: "Vault Invite Declined",
    message: `${memberEmail} declined your vault invite.`,
    data: { memberEmail, actionUrl: "/vault/members" },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

// ─── Member: leave a vault ────────────────────────────────────────────────────

export async function leaveVault(
  vaultOwnerId: string,
  memberUserId: string,
  memberEmail: string
): Promise<void> {
  const member = await VaultMember.findOne({
    vaultOwnerId,
    memberUserId,
    status: "active",
  });

  if (!member) {
    throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "You are not an active member of this vault");
  }

  member.status = "revoked";
  member.revokedAt = new Date();
  member.revokedBy = "member";
  await member.save();

  // Notify the vault owner
  await createNotification({
    userId: vaultOwnerId,
    type: "new_member",
    title: "Member Left Vault",
    message: `${memberEmail} left your vault.`,
    data: { memberEmail, actionUrl: "/vault/members" },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

// ─── Member: get all vaults I have access to ─────────────────────────────────

export async function getVaultsSharedWithMe(
  memberUserId: string
): Promise<IVaultMember[]> {
  return VaultMember.find({ memberUserId, status: "active" })
    .populate("vaultOwnerId", "name email avatar")
    .sort({ acceptedAt: -1 });
}

// ─── Guard: verify active membership ─────────────────────────────────────────

export async function assertVaultAccess(
  vaultOwnerId: string,
  requesterId: string
): Promise<IVaultMember> {
  // Owner always has access to their own vault
  if (vaultOwnerId === requesterId) {
    throw new ApiError(400, "OWN_VAULT", "Use your own document endpoints for your vault");
  }

  const member = await VaultMember.findOne({
    vaultOwnerId,
    memberUserId: requesterId,
    status: "active",
  });

  if (!member) {
    throw new ApiError(403, "VAULT_ACCESS_DENIED", "You do not have access to this vault");
  }

  return member;
}

// ─── Resend invite ────────────────────────────────────────────────────────────

export async function resendInvite(
  vaultOwnerId: string,
  ownerName: string,
  memberId: string
): Promise<IVaultMember> {
  const env = getEnv();
  const member = await VaultMember.findOne({ _id: memberId, vaultOwnerId });

  if (!member) {
    throw new ApiError(404, "MEMBER_NOT_FOUND", "Member not found");
  }
  if (member.status !== "pending") {
    throw new ApiError(400, "NOT_PENDING", "Can only resend to pending invites");
  }

  // Refresh token and expiry
  member.inviteToken = makeToken();
  member.inviteExpiresAt = inviteExpiresAt();
  await member.save();

  const inviteUrl = `${env.FRONTEND_ORIGIN}/vault/shared?invite=${member.inviteToken}`;

  await queueDocumentShared({
    email: member.memberEmail,
    recipientName: "there",
    ownerName,
    role: member.role,
    inviteUrl,
  });

  return member;
}
