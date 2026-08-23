/**
 * Scoped "view token" for account-less, view-only document access.
 *
 * A recipient who enters the correct link password receives one of these. It is
 * a JWT signed with the same secret as normal access tokens BUT carries
 * `scope: "share-view"` and no `userId`. That makes it safe by construction:
 * if anyone feeds it to the normal `protect` middleware, the `User.findById`
 * lookup runs against `undefined` and fails — so it can never be used as a
 * logged-in user session. It only unlocks the single shared document's bytes.
 */

import jwt from "jsonwebtoken";
import { getEnv } from "../../config/env.js";

const SHARE_VIEW_SCOPE = "share-view" as const;

export interface ShareViewTokenPayload {
  shareId: string;
  documentId: string;
  scope: typeof SHARE_VIEW_SCOPE;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export function signShareViewToken(input: { shareId: string; documentId: string }): string {
  const env = getEnv();
  return jwt.sign(
    { shareId: input.shareId, documentId: input.documentId, scope: SHARE_VIEW_SCOPE },
    env.JWT_ACCESS_SECRET,
    {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      // Short-lived: the viewer must have just proven the password. Long enough
      // to render a multi-page PDF, short enough that a leaked token expires fast.
      expiresIn: "15m",
    } as jwt.SignOptions
  );
}

export function verifyShareViewToken(token: string): ShareViewTokenPayload {
  const env = getEnv();
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }) as ShareViewTokenPayload;

  if (decoded.scope !== SHARE_VIEW_SCOPE) {
    throw new Error("Invalid token scope");
  }
  return decoded;
}
