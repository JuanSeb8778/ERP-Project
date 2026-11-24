import { productCreateSchema, productUpdateSchema } from "@techforge/shared";
import { prisma } from "../../core/prisma";
import { crudRouter, type CrudConfig } from "../../lib/crud";

export const productsRouter = crudRouter({
  resource: "product",
  entityType: "Product",
  model: prisma.product as unknown as CrudConfig["model"],
  createSchema: productCreateSchema,
  updateSchema: productUpdateSchema,
  searchFields: ["name", "sku", "category", "description"],
  sortableFields: ["createdAt", "name", "sku", "unitPrice", "category"],
});
