import { z } from "zod";

export const ITEM_TYPES = ["PRODUCT", "RAW_MATERIAL"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const STOCK_REASONS = [
  "OPENING",
  "PURCHASE_RECEIPT",
  "PRODUCTION_OUTPUT",
  "PRODUCTION_CONSUME",
  "SALE_DISPATCH",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "RETURN",
] as const;
export type StockReason = (typeof STOCK_REASONS)[number];

export const STOCK_REASON_LABELS: Record<StockReason, string> = {
  OPENING: "Opening balance",
  PURCHASE_RECEIPT: "Purchase receipt",
  PRODUCTION_OUTPUT: "Production output",
  PRODUCTION_CONSUME: "Production consumption",
  SALE_DISPATCH: "Sale / dispatch",
  ADJUSTMENT: "Manual adjustment",
  TRANSFER_IN: "Transfer in",
  TRANSFER_OUT: "Transfer out",
  RETURN: "Return",
};

/** Manual stock adjustment: set an absolute new quantity or apply a signed delta. */
export const stockAdjustSchema = z.object({
  warehouseId: z.string().min(1, "Select a warehouse"),
  itemType: z.enum(ITEM_TYPES),
  itemId: z.string().min(1, "Select an item"),
  delta: z.coerce.number().refine((n) => n !== 0, "Change cannot be zero"),
  reason: z.enum(STOCK_REASONS).default("ADJUSTMENT"),
  note: z.string().trim().max(300).optional(),
});
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;

/** Transfer stock between two warehouses. */
export const stockTransferSchema = z.object({
  fromWarehouseId: z.string().min(1, "Select source"),
  toWarehouseId: z.string().min(1, "Select destination"),
  itemType: z.enum(ITEM_TYPES),
  itemId: z.string().min(1, "Select an item"),
  quantity: z.coerce.number().positive("Qty must be > 0"),
  note: z.string().trim().max(300).optional(),
});
export type StockTransferInput = z.infer<typeof stockTransferSchema>;

export const inventoryQuerySchema = z.object({
  warehouseId: z.string().optional(),
  itemType: z.enum(ITEM_TYPES).optional(),
  lowOnly: z.coerce.boolean().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
