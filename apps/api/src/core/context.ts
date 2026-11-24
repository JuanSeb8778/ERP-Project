import { AsyncLocalStorage } from "node:async_hooks";

/** Per-request context carried implicitly through the call stack (no prop drilling). */
export interface RequestContext {
  requestId: string;
  userId?: string;
  companyId?: string;
  role?: string;
  permissions?: string[];
  ip?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Company id for the current request, used by the Prisma tenant guard. */
export function currentCompanyId(): string | undefined {
  return storage.getStore()?.companyId;
}
