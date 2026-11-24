import { Router } from "express";
import { prisma } from "../../core/prisma";
import { ok } from "../../core/result";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { asyncHandler } from "../../middleware/asyncHandler";
import { inventoryService } from "../inventory/inventory.service";

export const analyticsRouter: Router = Router();
analyticsRouter.use(authenticate);

analyticsRouter.get(
  "/summary",
  requirePermission("dashboard:read"),
  asyncHandler(async (_req, res) => {
    const [
      customers,
      products,
      openOrders,
      machines,
      productionActive,
      invoices,
      low,
      ordersByStatusRaw,
      machineByStatusRaw,
    ] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.salesOrder.count({ where: { deletedAt: null, status: { in: ["CONFIRMED", "IN_PRODUCTION"] } } }),
      prisma.machine.findMany({ where: { deletedAt: null } }),
      prisma.productionOrder.count({ where: { deletedAt: null, status: { in: ["RELEASED", "IN_PROGRESS"] } } }),
      prisma.invoice.findMany({ where: { deletedAt: null } }),
      inventoryService.lowStock(),
      prisma.salesOrder.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
      prisma.machine.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
    ]);

    const revenue = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const outstanding = invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);
    const running = machines.filter((m) => m.status === "RUNNING").length;
    const down = machines.filter((m) => m.status === "DOWN").length;

    return ok(res, {
      kpis: {
        customers,
        products,
        openOrders,
        lowStock: low.length,
        productionActive,
        machinesRunning: running,
        machinesDown: down,
        revenue,
        outstanding,
      },
      ordersByStatus: ordersByStatusRaw.map((r) => ({ status: r.status, count: r._count })),
      machinesByStatus: machineByStatusRaw.map((r) => ({ status: r.status, count: r._count })),
      lowStock: low.slice(0, 8),
    });
  }),
);
