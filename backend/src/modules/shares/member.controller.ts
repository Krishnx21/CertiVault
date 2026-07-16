/**
 * Member Controller - Handles member invitation and management HTTP requests
 */

import { Request, Response, NextFunction } from "express";
import {
  inviteMember,
  acceptInvite,
  declineInvite,
  revokeMember,
  updateMemberPermission,
  getDocumentMembers,
  getUserInvitations,
  getSharedWithUser,
} from "./member.service.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Invite a member to a document
 */
export const inviteMemberController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { documentId, memberEmail, memberName, permission, expiresAt } = req.body;

    const member = await inviteMember({
      documentId,
      memberEmail,
      memberName,
      permission,
      invitedBy: userId,
      invitedByName: req.user?.name || req.user?.email || "Unknown",
      invitedByEmail: req.user?.email || "",
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        id: member._id,
        memberEmail: member.memberEmail,
        memberName: member.memberName,
        permission: member.permission,
        inviteStatus: member.inviteStatus,
        inviteToken: member.inviteToken,
        expiresAt: member.expiresAt,
        createdAt: member.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept an invitation
 */
export const acceptInviteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { token } = req.params;
    const tokenStr = Array.isArray(token) ? token[0] : token;

    const member = await acceptInvite({
      inviteToken: tokenStr,
      userId,
      userEmail: req.user?.email || "",
      userName: req.user?.name || req.user?.email || "Unknown",
    });

    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Decline an invitation
 */
export const declineInviteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { token } = req.params;
    const tokenStr = Array.isArray(token) ? token[0] : token;

    await declineInvite(tokenStr, userId);

    res.json({
      success: true,
      message: "Invitation declined",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke member access
 */
export const revokeMemberController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { memberId } = req.params;
    const memberIdStr = Array.isArray(memberId) ? memberId[0] : memberId;

    await revokeMember(memberIdStr, userId);

    res.json({
      success: true,
      message: "Member access revoked",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update member permission
 */
export const updateMemberPermissionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { memberId } = req.params;
    const memberIdStr = Array.isArray(memberId) ? memberId[0] : memberId;
    const { permission } = req.body;

    const member = await updateMemberPermission(memberIdStr, userId, permission);

    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all members for a document
 */
export const getDocumentMembersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { documentId } = req.params;
    const documentIdStr = Array.isArray(documentId) ? documentId[0] : documentId;

    const members = await getDocumentMembers(documentIdStr, userId);

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invitations for the current user
 */
export const getUserInvitationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const userEmail = req.user?.email || "";

    const invitations = await getUserInvitations(userId, userEmail);

    res.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents shared with the current user
 */
export const getSharedWithUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");

    const result = await getSharedWithUser(userId, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
