import { Router } from "express";
import type { ZodSchema } from "zod";
import { paginationQuerySchema, type PermissionKey } from "@techforge/shared";
import { currentCompanyId } from "../core/context";
import { Errors } from "../core/errors";
import { ok, paginated, buildPageMeta } from "../core/result";
import { logActivity } from "../core/activity";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/requirePermission";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";

/** Minimal shape of a Prisma model delegate we rely on. */
interface Delegate {
  findMany(args: unknown): Promise<unknown[]>;
  findFirst(args: unknown): Promise<unknown>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<{ id: string }>;
  update(args: unknown): Promise<{ id: string }>;
  delete(args: unknown): Promise<unknown>;
}

export interface CrudConfig {
  /** Permission resource prefix, e.g. "customer" → customer:read/create/update/delete. */
  resource: string;
  /** Human entity name for audit logs, e.g. "Customer". */
  entityType: string;
  /** The tenant-scoped Prisma delegate, e.g. prisma.customer. */
  model: Delegate;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  /** Fields matched (case-insensitive contains) by the `q` search param. */
  searchFields?: string[];
  /** Fields allowed in `sort=field:dir`; first is the default (desc). */
  sortableFields?: string[];
  /** Prisma include for list/detail responses. */
  include?: unknown;
  /** Soft-delete via deletedAt instead of hard delete (default true). */
  softDelete?: boolean;
  /** Extra where clause merged into every list query. */
  baseWhere?: Record<string, unknown>;
  /** Override the permission required per action (defaults to `${resource}:${action}`). */
  permissions?: Partial<Record<"read" | "create" | "update" | "delete", PermissionKey>>;
}

function parseSort(sort: string | undefined, allowed: string[]): Record<string, "asc" | "desc"> {
  const fallback = allowed[0] ?? "createdAt";
  if (!sort) return { [fallback]: "desc" };
  const [field, dir] = sort.split(":");
  if (!allowed.includes(field)) return { [fallback]: "desc" };
  return { [field]: dir === "asc" ? "asc" : "desc" };
}

/**
 * Builds a full REST CRUD router for a tenant-scoped model. List/get/count are
 * auto-scoped to the company by the Prisma extension; create sets companyId
 * explicitly; update/delete first verify ownership with a scoped findFirst.
 */
export function crudRouter(cfg: CrudConfig): Router {
  const r = Router();
  const soft = cfg.softDelete ?? true;
  const sortable = cfg.sortableFields ?? ["createdAt", "name"];
  const notFound = () => Errors.notFound(`${cfg.entityType} not found`);
  const perm = (action: "read" | "create" | "update" | "delete") =>
    cfg.permissions?.[action] ?? (`${cfg.resource}:${action}` as PermissionKey);

  const baseWhere = () => ({ ...(soft ? { deletedAt: null } : {}), ...(cfg.baseWhere ?? {}) });

  r.use(authenticate);

  // LIST — paginated, searchable, sortable
  r.get(
    "/",
    requirePermission(perm("read")),
    validate(paginationQuerySchema, "query"),
    asyncHandler(async (req, res) => {
      const { page, pageSize, q, sort } = req.query as unknown as {
        page: number;
        pageSize: number;
        q?: string;
        sort?: string;
      };
      const where: Record<string, unknown> = baseWhere();
      if (q && cfg.searchFields?.length) {
        where.OR = cfg.searchFields.map((f) => ({ [f]: { contains: q, mode: "insensitive" } }));
      }
      const [rows, total] = await Promise.all([
        cfg.model.findMany({
          where,
          include: cfg.include,
          orderBy: parseSort(sort, sortable),
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        cfg.model.count({ where }),
      ]);
      return paginated(res, rows, buildPageMeta(total, page, pageSize));
    }),
  );

  // GET ONE
  r.get(
    "/:id",
    requirePermission(perm("read")),
    asyncHandler(async (req, res) => {
      const row = await cfg.model.findFirst({
        where: { id: req.params.id, ...baseWhere() },
        include: cfg.include,
      });
      if (!row) throw notFound();
      return ok(res, row);
    }),
  );

  // CREATE
  r.post(
    "/",
    requirePermission(perm("create")),
    validate(cfg.createSchema),
    asyncHandler(async (req, res) => {
      const companyId = currentCompanyId();
      const row = await cfg.model.create({
        data: { ...req.body, companyId },
        include: cfg.include,
      });
      await logActivity("CREATE", cfg.entityType, row.id, null, row);
      return ok(res, row, 201);
    }),
  );

  // UPDATE
  r.patch(
    "/:id",
    requirePermission(perm("update")),
    validate(cfg.updateSchema),
    asyncHandler(async (req, res) => {
      const existing = await cfg.model.findFirst({ where: { id: req.params.id, ...baseWhere() } });
      if (!existing) throw notFound();
      const row = await cfg.model.update({
        where: { id: req.params.id },
        data: req.body,
        include: cfg.include,
      });
      await logActivity("UPDATE", cfg.entityType, row.id, existing, row);
      return ok(res, row);
    }),
  );

  // DELETE (soft by default)
  r.delete(
    "/:id",
    requirePermission(perm("delete")),
    asyncHandler(async (req, res) => {
      const existing = await cfg.model.findFirst({ where: { id: req.params.id, ...baseWhere() } });
      if (!existing) throw notFound();
      if (soft) {
        await cfg.model.update({
          where: { id: req.params.id },
          data: { deletedAt: new Date(), isActive: false },
        });
      } else {
        await cfg.model.delete({ where: { id: req.params.id } });
      }
      await logActivity("DELETE", cfg.entityType, req.params.id, existing, null);
      return ok(res, { id: req.params.id });
    }),
  );

  return r;
}
