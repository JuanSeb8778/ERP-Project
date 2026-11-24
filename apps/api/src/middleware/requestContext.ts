import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { runWithContext, type RequestContext } from "../core/context";

/**
 * Establishes the AsyncLocalStorage context for the whole request lifecycle.
 * Auth middleware later fills in userId/companyId/permissions on the same object.
 */
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const ctx: RequestContext = {
    requestId: (req.headers["x-request-id"] as string) || randomUUID(),
    ip: req.ip,
  };
  res.setHeader("x-request-id", ctx.requestId);
  runWithContext(ctx, () => next());
}
