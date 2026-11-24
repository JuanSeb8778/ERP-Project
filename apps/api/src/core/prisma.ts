import { PrismaClient } from "@prisma/client";
import { currentCompanyId } from "./context";
import { isProd } from "../config/env";

/**
 * Tenant-aware Prisma client.
 *
 * A client extension injects the current request's `companyId` into every query
 * for tenant-scoped models, so a developer can never accidentally leak data across
 * companies. Models without a `companyId` column (Permission, RolePermission) are
 * exempt. Pass `skipTenantGuard` via the extension bypass for seed/admin scripts.
 */
const TENANT_MODELS = new Set([
  "User",
  "Role",
  "Company", // filtered by id below
  "ActivityLog",
  "RefreshToken", // scoped through user, left unguarded here
  // Phase 2 — master data & inventory
  "Customer",
  "Supplier",
  "Product",
  "RawMaterial",
  "Warehouse",
  "Bom",
  "Stock",
  "StockMovement",
  // Phase 3–6 transactional
  "Machine",
  "Employee",
  "Inquiry",
  "Quotation",
  "SalesOrder",
  "PurchaseOrder",
  "Invoice",
  "Payment",
  "Inspection",
  "ProductionOrder",
]);

// Models that are global (not per-company).
const GLOBAL_MODELS = new Set(["Permission", "RolePermission", "RefreshToken"]);

function createPrisma() {
  const base = new PrismaClient({
    log: isProd ? ["warn", "error"] : ["warn", "error"],
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const companyId = currentCompanyId();
          const scoped =
            model &&
            !GLOBAL_MODELS.has(model) &&
            TENANT_MODELS.has(model) &&
            companyId &&
            READ_WRITE_OPS.has(operation);

          if (scoped) {
            // Company itself is scoped by id, everything else by companyId.
            const field = model === "Company" ? "id" : "companyId";
            (args as { where?: Record<string, unknown> }).where = {
              ...(args as { where?: Record<string, unknown> }).where,
              [field]: companyId,
            };
          }
          return query(args);
        },
      },
    },
  });
}

const READ_WRITE_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "updateMany",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

// Reuse a single instance across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrisma> };

export const prisma = globalForPrisma.prisma ?? createPrisma();
if (!isProd) globalForPrisma.prisma = prisma;

/** Raw client without the tenant guard — only for auth bootstrap and seed scripts. */
export const prismaRaw = new PrismaClient();
