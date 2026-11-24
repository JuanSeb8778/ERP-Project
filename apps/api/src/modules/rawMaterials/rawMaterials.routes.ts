import { rawMaterialCreateSchema, rawMaterialUpdateSchema } from "@techforge/shared";
import { prisma } from "../../core/prisma";
import { crudRouter, type CrudConfig } from "../../lib/crud";

export const rawMaterialsRouter = crudRouter({
  resource: "rawmaterial",
  entityType: "RawMaterial",
  model: prisma.rawMaterial as unknown as CrudConfig["model"],
  createSchema: rawMaterialCreateSchema,
  updateSchema: rawMaterialUpdateSchema,
  searchFields: ["name", "code", "category"],
  sortableFields: ["createdAt", "name", "code", "unitCost", "category"],
});
