import { z } from "zod";

/** Reusable field helpers. Empty strings from forms coerce to undefined. */
const optionalString = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal("").transform(() => undefined));
const email = z.string().trim().email("Invalid email").optional().or(z.literal("").transform(() => undefined));
const code = z.string().trim().min(1, "Code is required").max(40);
const name = z.string().trim().min(1, "Name is required").max(160);
const money = z.coerce.number().min(0, "Must be ≥ 0").default(0);

export const UNITS = ["pcs", "kg", "g", "ltr", "ml", "m", "cm", "box", "set", "roll", "sheet"] as const;

/** ───────── Customer ───────── */
export const customerCreateSchema = z.object({
  code,
  name,
  contactPerson: optionalString,
  email,
  phone: optionalString,
  gstin: optionalString,
  billingAddress: optionalString,
  city: optionalString,
  state: optionalString,
  creditLimit: money,
  notes: optionalString,
  isActive: z.boolean().default(true),
});
export const customerUpdateSchema = customerCreateSchema.partial();
export type CustomerInput = z.infer<typeof customerCreateSchema>;

/** ───────── Supplier ───────── */
export const supplierCreateSchema = z.object({
  code,
  name,
  contactPerson: optionalString,
  email,
  phone: optionalString,
  gstin: optionalString,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  leadTimeDays: z.coerce.number().int().min(0).max(365).default(7),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: optionalString,
  isActive: z.boolean().default(true),
});
export const supplierUpdateSchema = supplierCreateSchema.partial();
export type SupplierInput = z.infer<typeof supplierCreateSchema>;

/** ───────── Product (finished good) ───────── */
export const productCreateSchema = z.object({
  sku: code,
  name,
  description: optionalString,
  category: optionalString,
  unit: z.enum(UNITS).default("pcs"),
  unitPrice: money,
  reorderPoint: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});
export const productUpdateSchema = productCreateSchema.partial();
export type ProductInput = z.infer<typeof productCreateSchema>;

/** ───────── Raw material ───────── */
export const rawMaterialCreateSchema = z.object({
  code,
  name,
  category: optionalString,
  unit: z.enum(UNITS).default("pcs"),
  unitCost: money,
  reorderPoint: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});
export const rawMaterialUpdateSchema = rawMaterialCreateSchema.partial();
export type RawMaterialInput = z.infer<typeof rawMaterialCreateSchema>;

/** ───────── Warehouse ───────── */
export const warehouseCreateSchema = z.object({
  code,
  name,
  location: optionalString,
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export const warehouseUpdateSchema = warehouseCreateSchema.partial();
export type WarehouseInput = z.infer<typeof warehouseCreateSchema>;

/** ───────── Bill of Materials ───────── */
export const bomComponentSchema = z.object({
  rawMaterialId: z.string().min(1, "Select a material"),
  quantity: z.coerce.number().positive("Qty must be > 0"),
  scrapPct: z.coerce.number().min(0).max(100).default(0),
});
export const bomCreateSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  name,
  version: z.string().trim().max(20).default("v1"),
  isActive: z.boolean().default(true),
  notes: optionalString,
  components: z.array(bomComponentSchema).min(1, "Add at least one component"),
});
export const bomUpdateSchema = bomCreateSchema.partial();
export type BomInput = z.infer<typeof bomCreateSchema>;
export type BomComponentInput = z.infer<typeof bomComponentSchema>;
