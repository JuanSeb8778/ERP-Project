import { supplierCreateSchema, supplierUpdateSchema } from "@techforge/shared";
import { prisma } from "../../core/prisma";
import { crudRouter, type CrudConfig } from "../../lib/crud";

export const suppliersRouter = crudRouter({
  resource: "supplier",
  entityType: "Supplier",
  model: prisma.supplier as unknown as CrudConfig["model"],
  createSchema: supplierCreateSchema,
  updateSchema: supplierUpdateSchema,
  searchFields: ["name", "code", "email", "phone", "city", "gstin"],
  sortableFields: ["createdAt", "name", "code", "leadTimeDays", "rating"],
});
