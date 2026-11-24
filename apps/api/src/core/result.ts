import type { Response } from "express";
import type { PageMeta } from "@techforge/shared";

/** Uniform success responses so the client always sees the same envelope. */
export function ok<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>) {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function paginated<T>(res: Response, data: T[], meta: PageMeta) {
  return res.status(200).json({ success: true, data, meta });
}

export function buildPageMeta(total: number, page: number, pageSize: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
