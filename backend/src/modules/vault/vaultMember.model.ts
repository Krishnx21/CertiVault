/**
 * VaultMember Model
 * Represents an invite/membership record granting one user access to another user's vault.
 */

import mongoose, { Document, Schema } from "mongoose";

export type VaultRole = "viewer" | "editor";
export type VaultMemberStatus = "pending" | "active" | "revoked" | "declined";
export type RevokedBy = "owner" | "member";

export interface IVaultMember extends Document {
  _id: mongoose.Types.ObjectId;
  /** The user who owns the vault (the inviter) */
  vaultOwnerId: mongoose.Types.ObjectId;
  /** Filled once the invite is accepted */
  memberUserId: mongoose.Types.ObjectId | null;
  /** Email address the invite was sent to */
  memberEmail: string;
  role: VaultRole;
  status: VaultMemberStatus;
  /** crypto.randomBytes(32).toString('hex') */
  inviteToken: string;
  inviteExpiresAt: Date;
  invitedAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  declinedAt: Date | null;
  revokedBy: RevokedBy | null;
  createdAt: Date;
  updatedAt: Date;
}

const vaultMemberSchema = new Schema<IVaultMember>(
  {
    vaultOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vault owner ID is required"],
      index: true,
    },
    memberUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    memberEmail: {
      type: String,
      required: [true, "Member email is required"],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor"],
      required: [true, "Role is required"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "revoked", "declined"],
      default: "pending",
    },
    inviteToken: {
      type: String,
      required: [true, "Invite token is required"],
      unique: true,
    },
    inviteExpiresAt: {
      type: Date,
      required: [true, "Invite expiry is required"],
    },
    invitedAt: {
      type: Date,
      default: () => new Date(),
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    declinedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: String,
      enum: ["owner", "member", null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique per owner+email: only one active/pending invite per email per vault
vaultMemberSchema.index(
  { vaultOwnerId: 1, memberEmail: 1 },
  { unique: true }
);

// Fast lookup for "vaults I'm a member of"
vaultMemberSchema.index({ memberUserId: 1, status: 1 });

export const VaultMember = mongoose.model<IVaultMember>(
  "VaultMember",
  vaultMemberSchema
);
