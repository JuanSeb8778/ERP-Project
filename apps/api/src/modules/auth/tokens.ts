import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { Errors } from "../../core/errors";

export interface AccessTokenPayload {
  sub: string; // userId
  companyId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options = { expiresIn: env.ACCESS_TOKEN_TTL } as SignOptions;
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw Errors.unauthorized("Invalid or expired token");
  }
}

/** Refresh tokens are opaque random strings; we sign a JWT wrapper for transport but
 *  validate the stored hash for revocation. Here we use a signed JWT with a jti. */
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options = { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` } as SignOptions;
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw Errors.unauthorized("Invalid or expired refresh token");
  }
}
