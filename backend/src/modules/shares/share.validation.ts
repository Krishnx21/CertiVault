/**
 * Zod schemas for the shares module.
 */

import { z } from "zod";

export const createShareSchema = z.object({
  documentId: z.string().min(1, "documentId is required"),
  // Optional link password. When present the recipient must enter it to view.
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  // datetime-local sends "YYYY-MM-DDTHH:mm" (no timezone) — accept any parseable date.
  expiresAt: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === "" || !Number.isNaN(Date.parse(v)), {
      message: "Invalid expiration date",
    }),
  maxAccessCount: z.number().int().positive("Max access count must be positive").optional(),
  recipientEmail: z.string().email("Invalid email address").optional(),
  message: z.string().max(500, "Message is too long").optional(),
});

export type CreateShareInput = z.infer<typeof createShareSchema>;

export const accessShareSchema = z.object({
  password: z.string().optional(),
});
