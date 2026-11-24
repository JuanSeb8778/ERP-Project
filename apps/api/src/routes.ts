import { Router } from "express";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { suppliersRouter } from "./modules/suppliers/suppliers.routes";
import { productsRouter } from "./modules/products/products.routes";
import { rawMaterialsRouter } from "./modules/rawMaterials/rawMaterials.routes";
import { warehousesRouter } from "./modules/warehouses/warehouses.routes";
import { inventoryRouter } from "./modules/inventory/inventory.routes";
import { bomRouter } from "./modules/bom/bom.routes";
import {
  machinesRouter,
  employeesRouter,
  inquiriesRouter,
  quotationsRouter,
  salesOrdersRouter,
  purchaseOrdersRouter,
  invoicesRouter,
  paymentsRouter,
  inspectionsRouter,
  productionOrdersRouter,
} from "./modules/transactions/transactions.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { assistantRouter } from "./modules/assistant/assistant.routes";

/** Versioned API surface. New feature modules mount here as phases land. */
export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);

// Phase 2 — master data & inventory
apiRouter.use("/customers", customersRouter);
apiRouter.use("/suppliers", suppliersRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/raw-materials", rawMaterialsRouter);
apiRouter.use("/warehouses", warehousesRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/boms", bomRouter);

// Phase 3–6 — sales, production, quality, purchasing, finance, HR
apiRouter.use("/machines", machinesRouter);
apiRouter.use("/employees", employeesRouter);
apiRouter.use("/inquiries", inquiriesRouter);
apiRouter.use("/quotations", quotationsRouter);
apiRouter.use("/orders", salesOrdersRouter);
apiRouter.use("/purchase-orders", purchaseOrdersRouter);
apiRouter.use("/invoices", invoicesRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/inspections", inspectionsRouter);
apiRouter.use("/production-orders", productionOrdersRouter);

// Phase 6/7 — analytics + AI assistant
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/assistant", assistantRouter);
