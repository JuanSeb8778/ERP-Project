import { warehouseCreateSchema, warehouseUpdateSchema } from "@techforge/shared";
import { prisma } from "../../core/prisma";
import { crudRouter, type CrudConfig } from "../../lib/crud";

// Warehouses reuse the inventory permissions (read to view, update to manage).
export const warehousesRouter = crudRouter({
  resource: "inventory",
  entityType: "Warehouse",
  model: prisma.warehouse as unknown as CrudConfig["model"],
  createSchema: warehouseCreateSchema,
  updateSchema: warehouseUpdateSchema,
  searchFields: ["name", "code", "location"],
  sortableFields: ["createdAt", "name", "code"],
  permissions: {
    read: "inventory:read",
    create: "inventory:update",
    update: "inventory:update",
    delete: "inventory:update",
  },
});
