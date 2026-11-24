import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../modules/auth/tokens";
import { getContext } from "../core/context";
import { Errors } from "../core/errors";
import { prismaRaw } from "../core/prisma";

/**
 * Authenticates the request from the Bearer access token, then loads the user's
 * live permission set and writes identity into the request context. Permissions
 * are resolved server-side (not trusted from the token) so revocation is instant.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw Errors.unauthorized();
    const token = header.slice(7);

    const payload = verifyAccessToken(token);

    const user = await prismaRaw.user.findUnique({
      where: { id: payload.sub },
      include: {
        company: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
    if (!user || !user.isActive || user.deletedAt) throw Errors.unauthorized("Account inactive");

    const ctx = getContext();
    if (ctx) {
      ctx.userId = user.id;
      ctx.companyId = user.companyId;
      ctx.role = user.role.name;
      ctx.permissions = user.role.permissions.map((rp) => rp.permission.key);
    }
    next();
  } catch (err) {
    next(err instanceof Error ? err : Errors.unauthorized());
  }
}
