import {
  machine,
  employee,
  inquiry,
  quotation,
  salesOrder,
  purchaseOrder,
  invoice,
  payment,
  inspection,
  productionOrder,
} from "@techforge/shared";
import { prisma } from "../../core/prisma";
import { crudRouter, type CrudConfig } from "../../lib/crud";

const model = (m: unknown) => m as unknown as CrudConfig["model"];
const customerInc = { customer: { select: { id: true, name: true, code: true } } };

export const machinesRouter = crudRouter({
  resource: "machine", entityType: "Machine", model: model(prisma.machine),
  createSchema: machine.create, updateSchema: machine.update,
  searchFields: ["code", "name", "type", "location"],
  sortableFields: ["createdAt", "name", "code", "status"],
  permissions: { delete: "machine:update" },
});

export const employeesRouter = crudRouter({
  resource: "employee", entityType: "Employee", model: model(prisma.employee),
  createSchema: employee.create, updateSchema: employee.update,
  searchFields: ["code", "firstName", "lastName", "department", "designation", "email"],
  sortableFields: ["createdAt", "firstName", "code", "department"],
  permissions: { delete: "employee:update" },
});

export const inquiriesRouter = crudRouter({
  resource: "inquiry", entityType: "Inquiry", model: model(prisma.inquiry),
  createSchema: inquiry.create, updateSchema: inquiry.update, include: customerInc,
  searchFields: ["number", "subject", "status"],
  sortableFields: ["createdAt", "number", "status"],
  permissions: { delete: "inquiry:update" },
});

export const quotationsRouter = crudRouter({
  resource: "quotation", entityType: "Quotation", model: model(prisma.quotation),
  createSchema: quotation.create, updateSchema: quotation.update, include: customerInc,
  searchFields: ["number", "status"],
  sortableFields: ["createdAt", "number", "status", "total"],
  permissions: { delete: "quotation:update" },
});

export const salesOrdersRouter = crudRouter({
  resource: "order", entityType: "SalesOrder", model: model(prisma.salesOrder),
  createSchema: salesOrder.create, updateSchema: salesOrder.update, include: customerInc,
  searchFields: ["number", "status"],
  sortableFields: ["createdAt", "number", "status", "total"],
  permissions: { delete: "order:update" },
});

export const purchaseOrdersRouter = crudRouter({
  resource: "purchase", entityType: "PurchaseOrder", model: model(prisma.purchaseOrder),
  createSchema: purchaseOrder.create, updateSchema: purchaseOrder.update,
  include: { supplier: { select: { id: true, name: true, code: true } } },
  searchFields: ["number", "status"],
  sortableFields: ["createdAt", "number", "status", "total"],
  permissions: { delete: "purchase:update" },
});

export const invoicesRouter = crudRouter({
  resource: "invoice", entityType: "Invoice", model: model(prisma.invoice),
  createSchema: invoice.create, updateSchema: invoice.update, include: customerInc,
  searchFields: ["number", "status"],
  sortableFields: ["createdAt", "number", "status", "total"],
  permissions: { delete: "invoice:update" },
});

export const paymentsRouter = crudRouter({
  resource: "payment", entityType: "Payment", model: model(prisma.payment),
  createSchema: payment.create, updateSchema: payment.update, include: customerInc,
  searchFields: ["number", "reference", "method"],
  sortableFields: ["createdAt", "number", "amount"],
  permissions: { update: "payment:create", delete: "payment:create" },
});

export const inspectionsRouter = crudRouter({
  resource: "quality", entityType: "Inspection", model: model(prisma.inspection),
  createSchema: inspection.create, updateSchema: inspection.update,
  searchFields: ["number", "type", "status", "reference"],
  sortableFields: ["createdAt", "number", "status"],
  permissions: { delete: "quality:update" },
});

export const productionOrdersRouter = crudRouter({
  resource: "production", entityType: "ProductionOrder", model: model(prisma.productionOrder),
  createSchema: productionOrder.create, updateSchema: productionOrder.update,
  include: { product: { select: { id: true, name: true, sku: true } } },
  searchFields: ["number", "status"],
  sortableFields: ["createdAt", "number", "status"],
  permissions: { delete: "production:update" },
});
