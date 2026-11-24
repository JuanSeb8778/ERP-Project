import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { AuthUser, LoginInput } from "@techforge/shared";
import { prismaRaw } from "../../core/prisma";
import { env } from "../../config/env";
import { Errors } from "../../core/errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./tokens";

type UserWithRole = NonNullable<Awaited<ReturnType<typeof findUserWithRole>>>;

function findUserWithRole(where: { id: string } | { email_company: { email: string } }) {
  const query =
    "id" in where
      ? { id: where.id }
      : { email: where.email_company.email };
  return prismaRaw.user.findFirst({
    where: { ...query, deletedAt: null },
    include: {
      company: true,
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });
}

function toAuthUser(user: UserWithRole): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    companyId: user.companyId,
    companyName: user.company.name,
    role: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key) as AuthUser["permissions"],
  };
}

async function issueTokens(userId: string, companyId: string) {
  const jti = randomUUID();
  const refreshToken = signRefreshToken({ sub: userId, jti });
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prismaRaw.refreshToken.create({
    data: { id: jti, userId, tokenHash, expiresAt },
  });

  return { accessToken: signAccessToken({ sub: userId, companyId }), refreshToken };
}

export const authService = {
  async login({ email, password }: LoginInput) {
    const user = await findUserWithRole({ email_company: { email } });
    // Constant-ish path: always run a compare to reduce user-enumeration timing signal.
    const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidin";
    const valid = await bcrypt.compare(password, hash);
    if (!user || !valid) throw Errors.unauthorized("Invalid email or password");
    if (!user.isActive) throw Errors.forbidden("Account is deactivated");

    await prismaRaw.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await issueTokens(user.id, user.companyId);
    return { ...tokens, user: toAuthUser(user) };
  },

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw Errors.unauthorized("Missing refresh token");
    const payload = verifyRefreshToken(refreshToken);

    const stored = await prismaRaw.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw Errors.unauthorized("Refresh token is no longer valid");
    }
    const matches = await bcrypt.compare(refreshToken, stored.tokenHash);
    if (!matches) throw Errors.unauthorized("Refresh token mismatch");

    const user = await findUserWithRole({ id: payload.sub });
    if (!user || !user.isActive) throw Errors.unauthorized("Account inactive");

    // Rotate: revoke the used token, issue a fresh pair.
    await prismaRaw.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await issueTokens(user.id, user.companyId);
    return { ...tokens, user: toAuthUser(user) };
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    try {
      const { jti } = verifyRefreshToken(refreshToken);
      await prismaRaw.refreshToken.updateMany({
        where: { id: jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* already invalid — nothing to revoke */
    }
  },

  async me(userId: string): Promise<AuthUser> {
    const user = await findUserWithRole({ id: userId });
    if (!user) throw Errors.unauthorized();
    return toAuthUser(user);
  },
};
