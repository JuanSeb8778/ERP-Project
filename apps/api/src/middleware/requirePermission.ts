import type { NextFunction, Request, Response } from "express";
import type { PermissionKey } from "@techforge/shared";
import { getContext } from "../core/context";
import { Errors } from "../core/errors";

/**
 * Guards a route by permission key(s). Passing multiple keys requires ALL of them.
 * RBAC is checked against the live permission set loaded by `authenticate`.
 */
export function requirePermission(...required: PermissionKey[]) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    const ctx = getContext();
    if (!ctx?.userId) return next(Errors.unauthorized());
    const held = new Set(ctx.permissions ?? []);
    const missing = required.filter((p) => !held.has(p));
    if (missing.length) {
      return next(Errors.forbidden(`Missing permission: ${missing.join(", ")}`));
    }
    next();
  };
}
