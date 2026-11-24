import type { ItemType, StockAdjustInput, StockTransferInput } from "@techforge/shared";
import { prisma } from "../../core/prisma";
import { currentCompanyId } from "../../core/context";
import { Errors } from "../../core/errors";

interface StockFilters {
  warehouseId?: string;
  itemType?: ItemType;
  lowOnly?: boolean;
  q?: string;
  page: number;
  pageSize: number;
}

interface EnrichedItem {
  itemId: string;
  itemType: ItemType;
  name: string;
  code: string;
  unit: string;
  reorderPoint: number;
}

/** Load display info for a set of products + raw materials in bulk (tenant-scoped). */
async function loadItemIndex(): Promise<Map<string, EnrichedItem>> {
  const [products, raws] = await Promise.all([
    prisma.product.findMany({ where: { deletedAt: null } }),
    prisma.rawMaterial.findMany({ where: { deletedAt: null } }),
  ]);
  const index = new Map<string, EnrichedItem>();
  for (const p of products) {
    index.set(`PRODUCT:${p.id}`, {
      itemId: p.id,
      itemType: "PRODUCT",
      name: p.name,
      code: p.sku,
      unit: p.unit,
      reorderPoint: p.reorderPoint,
    });
  }
  for (const m of raws) {
    index.set(`RAW_MATERIAL:${m.id}`, {
      itemId: m.id,
      itemType: "RAW_MATERIAL",
      name: m.name,
      code: m.code,
      unit: m.unit,
      reorderPoint: m.reorderPoint,
    });
  }
  return index;
}

async function assertWarehouse(id: string) {
  const wh = await prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
  if (!wh) throw Errors.notFound("Warehouse not found");
  return wh;
}

async function assertItem(itemType: ItemType, itemId: string) {
  const found =
    itemType === "PRODUCT"
      ? await prisma.product.findFirst({ where: { id: itemId, deletedAt: null } })
      : await prisma.rawMaterial.findFirst({ where: { id: itemId, deletedAt: null } });
  if (!found) throw Errors.notFound("Item not found");
}

export const inventoryService = {
  /** Per-warehouse stock levels, enriched with item name + low-stock flag. */
  async listStock(filters: StockFilters) {
    const where: Record<string, unknown> = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.itemType) where.itemType = filters.itemType;

    const [rows, index] = await Promise.all([
      prisma.stock.findMany({ where, include: { warehouse: true }, orderBy: { updatedAt: "desc" } }),
      loadItemIndex(),
    ]);

    let enriched = rows.map((s) => {
      const item = index.get(`${s.itemType}:${s.itemId}`);
      const reorderPoint = item?.reorderPoint ?? 0;
      return {
        id: s.id,
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse.name,
        warehouseCode: s.warehouse.code,
        itemType: s.itemType,
        itemId: s.itemId,
        name: item?.name ?? "(deleted item)",
        code: item?.code ?? "—",
        unit: item?.unit ?? "",
        quantity: s.quantity,
        reorderPoint,
        isLow: s.quantity <= reorderPoint,
        updatedAt: s.updatedAt,
      };
    });

    if (filters.lowOnly) enriched = enriched.filter((r) => r.isLow);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      enriched = enriched.filter(
        (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
      );
    }

    const total = enriched.length;
    const start = (filters.page - 1) * filters.pageSize;
    const data = enriched.slice(start, start + filters.pageSize);
    return { data, total };
  },

  /** Items at or below their reorder point (for dashboards / purchasing). */
  async lowStock() {
    const { data } = await this.listStock({ lowOnly: true, page: 1, pageSize: 1000 });
    return data;
  },

  /** Recent stock movements (the ledger), enriched with names. */
  async listMovements(params: { itemId?: string; warehouseId?: string; page: number; pageSize: number }) {
    const where: Record<string, unknown> = {};
    if (params.itemId) where.itemId = params.itemId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    const [rows, total, index] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { warehouse: true },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.stockMovement.count({ where }),
      loadItemIndex(),
    ]);

    const data = rows.map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      warehouseName: m.warehouse.name,
      itemType: m.itemType,
      name: index.get(`${m.itemType}:${m.itemId}`)?.name ?? "(deleted item)",
      delta: m.delta,
      balanceAfter: m.balanceAfter,
      reason: m.reason,
      note: m.note,
    }));
    return { data, total };
  },

  /** Apply a signed change to one item's stock in a warehouse + write the ledger entry. */
  async adjust(input: StockAdjustInput, userId?: string) {
    const companyId = currentCompanyId();
    if (!companyId) throw Errors.unauthorized();
    await assertWarehouse(input.warehouseId);
    await assertItem(input.itemType, input.itemId);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.stock.findFirst({
        where: { warehouseId: input.warehouseId, itemType: input.itemType, itemId: input.itemId },
      });
      const current = existing?.quantity ?? 0;
      const newQty = current + input.delta;
      if (newQty < 0) throw Errors.badRequest("Adjustment would drive stock below zero");

      const stock = existing
        ? await tx.stock.update({ where: { id: existing.id }, data: { quantity: newQty } })
        : await tx.stock.create({
            data: {
              companyId,
              warehouseId: input.warehouseId,
              itemType: input.itemType,
              itemId: input.itemId,
              quantity: newQty,
            },
          });

      const movement = await tx.stockMovement.create({
        data: {
          companyId,
          warehouseId: input.warehouseId,
          itemType: input.itemType,
          itemId: input.itemId,
          delta: input.delta,
          balanceAfter: newQty,
          reason: input.reason,
          note: input.note,
          createdById: userId,
        },
      });
      return { stock, movement };
    });
  },

  /** Move quantity between two warehouses (two ledger entries) atomically. */
  async transfer(input: StockTransferInput, userId?: string) {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw Errors.badRequest("Source and destination must differ");
    }
    await this.adjust(
      {
        warehouseId: input.fromWarehouseId,
        itemType: input.itemType,
        itemId: input.itemId,
        delta: -input.quantity,
        reason: "TRANSFER_OUT",
        note: input.note,
      },
      userId,
    );
    await this.adjust(
      {
        warehouseId: input.toWarehouseId,
        itemType: input.itemType,
        itemId: input.itemId,
        delta: input.quantity,
        reason: "TRANSFER_IN",
        note: input.note,
      },
      userId,
    );
    return { transferred: input.quantity };
  },
};
