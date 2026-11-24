import { customerCreateSchema, customerUpdateSchema } from "@techforge/shared";
import { prisma } from "../../core/prisma";
import { crudRouter, type CrudConfig } from "../../lib/crud";

export const customersRouter = crudRouter({
  resource: "customer",
  entityType: "Customer",
  model: prisma.customer as unknown as CrudConfig["model"],
  createSchema: customerCreateSchema,
  updateSchema: customerUpdateSchema,
  searchFields: ["name", "code", "email", "phone", "city", "gstin"],
  sortableFields: ["createdAt", "name", "code", "creditLimit"],
});
