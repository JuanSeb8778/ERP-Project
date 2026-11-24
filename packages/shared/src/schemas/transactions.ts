import { z } from "zod";

const opt = z.string().trim().max(400).optional().or(z.literal("").transform(() => undefined));
const name = z.string().trim().min(1, "Required").max(160);
const num = z.string().trim().min(1, "Required").max(40);
const money = z.coerce.number().min(0).default(0);
const dateOpt = z.string().optional().or(z.literal("").transform(() => undefined));

/** Status option lists (shared by forms + badge colouring). */
export const MACHINE_STATUSES = ["IDLE", "RUNNING", "DOWN", "MAINTENANCE"] as const;
export const EMPLOYEE_STATUSES = ["ACTIVE", "ON_LEAVE", "EXITED"] as const;
export const INQUIRY_STATUSES = ["OPEN", "QUOTED", "WON", "LOST"] as const;
export const QUOTATION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;
export const SALES_ORDER_STATUSES = ["CONFIRMED", "IN_PRODUCTION", "DISPATCHED", "CLOSED", "CANCELLED"] as const;
export const PURCHASE_ORDER_STATUSES = ["DRAFT", "SENT", "RECEIVED", "CANCELLED"] as const;
export const INVOICE_STATUSES = ["ISSUED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"] as const;
export const PAYMENT_METHODS = ["BANK", "CASH", "UPI", "CHEQUE"] as const;
export const INSPECTION_TYPES = ["INCOMING", "IN_PROCESS", "FINAL"] as const;
export const INSPECTION_STATUSES = ["PENDING", "PASSED", "FAILED"] as const;
export const PRODUCTION_STATUSES = ["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

/** Maps a status string to a badge variant for consistent colours. */
export const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "info" | "secondary" | "default"> = {
  RUNNING: "success", IDLE: "secondary", DOWN: "destructive", MAINTENANCE: "warning",
  ACTIVE: "success", ON_LEAVE: "warning", EXITED: "secondary",
  OPEN: "info", QUOTED: "warning", WON: "success", LOST: "destructive",
  DRAFT: "secondary", SENT: "info", ACCEPTED: "success", REJECTED: "destructive",
  CONFIRMED: "info", IN_PRODUCTION: "warning", DISPATCHED: "success", CLOSED: "secondary", CANCELLED: "destructive",
  RECEIVED: "success",
  ISSUED: "info", PARTIAL: "warning", PAID: "success", OVERDUE: "destructive",
  PENDING: "warning", PASSED: "success", FAILED: "destructive",
  PLANNED: "secondary", RELEASED: "info", IN_PROGRESS: "warning", COMPLETED: "success",
};

const mk = <T extends z.ZodRawShape>(shape: T) => {
  const create = z.object(shape);
  return { create, update: create.partial() };
};

export const machine = mk({
  code: num, name, type: opt, status: z.enum(MACHINE_STATUSES).default("IDLE"),
  location: opt, notes: opt, isActive: z.boolean().default(true),
});
export const employee = mk({
  code: num, firstName: name, lastName: name, department: opt, designation: opt,
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  phone: opt, dateOfJoining: dateOpt, status: z.enum(EMPLOYEE_STATUSES).default("ACTIVE"),
  notes: opt, isActive: z.boolean().default(true),
});
export const inquiry = mk({
  number: num, customerId: z.string().min(1, "Select a customer"), subject: name,
  status: z.enum(INQUIRY_STATUSES).default("OPEN"), expectedDate: dateOpt, notes: opt,
});
export const quotation = mk({
  number: num, customerId: z.string().min(1, "Select a customer"),
  status: z.enum(QUOTATION_STATUSES).default("DRAFT"), validUntil: dateOpt,
  subtotal: money, taxPct: z.coerce.number().min(0).max(100).default(18), total: money, notes: opt,
});
export const salesOrder = mk({
  number: num, customerId: z.string().min(1, "Select a customer"),
  status: z.enum(SALES_ORDER_STATUSES).default("CONFIRMED"), total: money, notes: opt,
});
export const purchaseOrder = mk({
  number: num, supplierId: z.string().min(1, "Select a supplier"),
  status: z.enum(PURCHASE_ORDER_STATUSES).default("DRAFT"), total: money, notes: opt,
});
export const invoice = mk({
  number: num, customerId: z.string().min(1, "Select a customer"),
  status: z.enum(INVOICE_STATUSES).default("ISSUED"), dueDate: dateOpt,
  total: money, amountPaid: money, notes: opt,
});
export const payment = mk({
  number: num, customerId: z.string().min(1, "Select a customer"),
  amount: z.coerce.number().positive("Must be > 0"), method: z.enum(PAYMENT_METHODS).default("BANK"),
  reference: opt, notes: opt,
});
export const inspection = mk({
  number: num, type: z.enum(INSPECTION_TYPES).default("INCOMING"),
  status: z.enum(INSPECTION_STATUSES).default("PENDING"), result: opt, reference: opt, notes: opt,
});
export const productionOrder = mk({
  number: num, productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().positive("Must be > 0"),
  status: z.enum(PRODUCTION_STATUSES).default("PLANNED"), notes: opt,
});
