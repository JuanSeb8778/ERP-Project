import { prismaRaw } from "./prisma";
import { getContext } from "./context";
import { logger } from "./logger";

type Action = "CREATE" | "UPDATE" | "DELETE" | "STATE_CHANGE" | "LOGIN" | "LOGOUT";

/**
 * Append an audit record for the current request. Best-effort: a logging failure
 * must never break the business operation, so errors are swallowed with a warning.
 * Uses the raw client (companyId is set explicitly from request context).
 */
export async function logActivity(
  action: Action,
  entityType: string,
  entityId: string | null,
  before: unknown,
  after: unknown,
): Promise<void> {
  const ctx = getContext();
  if (!ctx?.companyId) return;
  try {
    await prismaRaw.activityLog.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId ?? null,
        action,
        entityType,
        entityId: entityId ?? undefined,
        before: (before as object) ?? undefined,
        after: (after as object) ?? undefined,
        ip: ctx.ip,
      },
    });
  } catch (err) {
    logger.warn({ err, action, entityType }, "Failed to write activity log");
  }
}
