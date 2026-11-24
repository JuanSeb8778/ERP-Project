import { Router } from "express";
import { bomCreateSchema, bomUpdateSchema, paginationQuerySchema } from "@techforge/shared";
import { prisma } from "../../core/prisma";
import { currentCompanyId } from "../../core/context";
import { Errors } from "../../core/errors";
import { ok, paginated, buildPageMeta } from "../../core/result";
import { logActivity } from "../../core/activity";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/asyncHandler";

const bomInclude = {
  product: { select: { id: true, sku: true, name: true, unit: true } },
  components: {
    include: { rawMaterial: { select: { id: true, code: true, name: true, unit: true, unitCost: true } } },
  },
};

async function assertProduct(productId: string) {
  const p = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!p) throw Errors.badRequest("Selected product does not exist");
}

async function assertRawMaterials(ids: string[]) {
  const unique = [...new Set(ids)];
  const found = await prisma.rawMaterial.count({ where: { id: { in: unique }, deletedAt: null } });
  if (found !== unique.length) throw Errors.badRequest("One or more materials do not exist");
}

export const bomRouter: Router = Router();
bomRouter.use(authenticate);

// LIST
bomRouter.get(
  "/",
  requirePermission("product:read"),
  validate(paginationQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { page, pageSize, q } = req.query as unknown as {
      page: number;
      pageSize: number;
      q?: string;
    };
    const where: Record<string, unknown> = { deletedAt: null };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { product: { sku: { contains: q, mode: "insensitive" } } },
      ];
    }
    const [rows, total] = await Promise.all([
      prisma.bom.findMany({
        where,
        include: {
          product: { select: { sku: true, name: true } },
          _count: { select: { components: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.bom.count({ where }),
    ]);
    return paginated(res, rows, buildPageMeta(total, page, pageSize));
  }),
);

// GET ONE
bomRouter.get(
  "/:id",
  requirePermission("product:read"),
  asyncHandler(async (req, res) => {
    const bom = await prisma.bom.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: bomInclude,
    });
    if (!bom) throw Errors.notFound("BOM not found");
    return ok(res, bom);
  }),
);

// CREATE
bomRouter.post(
  "/",
  requirePermission("production:create"),
  validate(bomCreateSchema),
  asyncHandler(async (req, res) => {
    const companyId = currentCompanyId();
    if (!companyId) throw Errors.unauthorized();
    const { components, ...bom } = req.body;
    await assertProduct(bom.productId);
    await assertRawMaterials(components.map((c: { rawMaterialId: string }) => c.rawMaterialId));

    const created = await prisma.bom.create({
      data: {
        ...bom,
        companyId,
        components: {
          create: components.map((c: { rawMaterialId: string; quantity: number; scrapPct: number }) => ({
            rawMaterialId: c.rawMaterialId,
            quantity: c.quantity,
            scrapPct: c.scrapPct,
          })),
        },
      },
      include: bomInclude,
    });
    await logActivity("CREATE", "Bom", created.id, null, created);
    return ok(res, created, 201);
  }),
);

// UPDATE (replaces components when provided)
bomRouter.patch(
  "/:id",
  requirePermission("production:update"),
  validate(bomUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.bom.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw Errors.notFound("BOM not found");

    const { components, ...bom } = req.body;
    if (bom.productId) await assertProduct(bom.productId);
    if (components) {
      await assertRawMaterials(components.map((c: { rawMaterialId: string }) => c.rawMaterialId));
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (components) {
        await tx.bomComponent.deleteMany({ where: { bomId: req.params.id } });
        await tx.bomComponent.createMany({
          data: components.map((c: { rawMaterialId: string; quantity: number; scrapPct: number }) => ({
            bomId: req.params.id,
            rawMaterialId: c.rawMaterialId,
            quantity: c.quantity,
            scrapPct: c.scrapPct,
          })),
        });
      }
      return tx.bom.update({ where: { id: req.params.id }, data: bom, include: bomInclude });
    });
    await logActivity("UPDATE", "Bom", updated.id, existing, updated);
    return ok(res, updated);
  }),
);

// DELETE (soft)
bomRouter.delete(
  "/:id",
  requirePermission("production:update"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.bom.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw Errors.notFound("BOM not found");
    await prisma.bom.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false } });
    await logActivity("DELETE", "Bom", req.params.id, existing, null);
    return ok(res, { id: req.params.id });
  }),
);
