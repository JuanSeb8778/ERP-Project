import { Router } from "express";
import { stockAdjustSchema, stockTransferSchema, inventoryQuerySchema } from "@techforge/shared";
import { ok, paginated, buildPageMeta } from "../../core/result";
import { getContext } from "../../core/context";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../core/activity";
import { inventoryService } from "./inventory.service";

export const inventoryRouter: Router = Router();

inventoryRouter.use(authenticate);

// Stock levels across warehouses
inventoryRouter.get(
  "/",
  requirePermission("inventory:read"),
  validate(inventoryQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as Parameters<typeof inventoryService.listStock>[0];
    const { data, total } = await inventoryService.listStock(filters);
    return paginated(res, data, buildPageMeta(total, filters.page, filters.pageSize));
  }),
);

// Items below reorder point
inventoryRouter.get(
  "/low-stock",
  requirePermission("inventory:read"),
  asyncHandler(async (_req, res) => ok(res, await inventoryService.lowStock())),
);

// Ledger
inventoryRouter.get(
  "/movements",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const { data, total } = await inventoryService.listMovements({
      itemId: req.query.itemId as string | undefined,
      warehouseId: req.query.warehouseId as string | undefined,
      page,
      pageSize,
    });
    return paginated(res, data, buildPageMeta(total, page, pageSize));
  }),
);

// Adjust one item's stock
inventoryRouter.post(
  "/adjust",
  requirePermission("inventory:update"),
  validate(stockAdjustSchema),
  asyncHandler(async (req, res) => {
    const userId = getContext()?.userId;
    const result = await inventoryService.adjust(req.body, userId);
    await logActivity("UPDATE", "Stock", result.stock.id, null, result.movement);
    return ok(res, result, 201);
  }),
);

// Transfer between warehouses
inventoryRouter.post(
  "/transfer",
  requirePermission("inventory:update"),
  validate(stockTransferSchema),
  asyncHandler(async (req, res) => {
    const userId = getContext()?.userId;
    const result = await inventoryService.transfer(req.body, userId);
    await logActivity("UPDATE", "Stock", req.body.itemId, null, req.body);
    return ok(res, result, 201);
  }),
);
