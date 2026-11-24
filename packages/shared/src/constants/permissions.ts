import { ROLES, type RoleName } from "./roles";

/**
 * Permissions are `resource:action` strings. RBAC middleware checks these — never role names.
 * Adding a role becomes a data change (which permissions it holds), not a code change.
 */
export const RESOURCES = [
  "company", "user", "role", "audit",
  "customer", "supplier", "product", "rawmaterial", "inventory",
  "inquiry", "quotation", "order",
  "production", "machine", "maintenance", "quality",
  "purchase", "dispatch", "invoice", "payment",
  "employee", "attendance", "leave",
  "dashboard", "analytics", "report", "document", "ai",
] as const;
export type Resource = (typeof RESOURCES)[number];

// Canonical permission keys used across the app.
export const PERMISSIONS = {
  // settings / admin
  companyRead: "company:read", companyUpdate: "company:update",
  userRead: "user:read", userCreate: "user:create", userUpdate: "user:update", userDelete: "user:delete",
  roleRead: "role:read", roleCreate: "role:create", roleUpdate: "role:update",
  auditRead: "audit:read",
  // master data
  customerRead: "customer:read", customerCreate: "customer:create", customerUpdate: "customer:update", customerDelete: "customer:delete",
  supplierRead: "supplier:read", supplierCreate: "supplier:create", supplierUpdate: "supplier:update", supplierDelete: "supplier:delete",
  productRead: "product:read", productCreate: "product:create", productUpdate: "product:update", productDelete: "product:delete",
  rawmaterialRead: "rawmaterial:read", rawmaterialCreate: "rawmaterial:create", rawmaterialUpdate: "rawmaterial:update", rawmaterialDelete: "rawmaterial:delete",
  inventoryRead: "inventory:read", inventoryUpdate: "inventory:update",
  // sales
  inquiryRead: "inquiry:read", inquiryCreate: "inquiry:create", inquiryUpdate: "inquiry:update",
  quotationRead: "quotation:read", quotationCreate: "quotation:create", quotationUpdate: "quotation:update",
  orderRead: "order:read", orderCreate: "order:create", orderUpdate: "order:update",
  // production / mes
  productionRead: "production:read", productionCreate: "production:create", productionUpdate: "production:update",
  productionRelease: "production:release", productionExecute: "production:execute",
  machineRead: "machine:read", machineCreate: "machine:create", machineUpdate: "machine:update",
  maintenanceRead: "maintenance:read", maintenanceCreate: "maintenance:create", maintenanceUpdate: "maintenance:update",
  // quality
  qualityRead: "quality:read", qualityCreate: "quality:create", qualityUpdate: "quality:update", qualityApprove: "quality:approve",
  // purchasing / dispatch / finance
  purchaseRead: "purchase:read", purchaseCreate: "purchase:create", purchaseUpdate: "purchase:update", purchaseReceive: "purchase:receive",
  dispatchRead: "dispatch:read", dispatchCreate: "dispatch:create",
  invoiceRead: "invoice:read", invoiceCreate: "invoice:create", invoiceUpdate: "invoice:update",
  paymentRead: "payment:read", paymentCreate: "payment:create",
  // hr
  employeeRead: "employee:read", employeeCreate: "employee:create", employeeUpdate: "employee:update",
  attendanceRead: "attendance:read", attendanceCreate: "attendance:create",
  leaveRead: "leave:read", leaveCreate: "leave:create", leaveApprove: "leave:approve",
  // insight
  dashboardRead: "dashboard:read",
  analyticsRead: "analytics:read",
  reportRead: "report:read", reportExport: "report:export",
  documentRead: "document:read", documentCreate: "document:create",
  aiUse: "ai:use",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

const P = PERMISSIONS;

/**
 * Default role → permission matrix used by the seed and the permission-matrix UI.
 * Admin implicitly holds everything.
 */
export const ROLE_PERMISSION_MATRIX: Record<RoleName, PermissionKey[]> = {
  [ROLES.ADMIN]: ALL_PERMISSIONS,
  [ROLES.SALES_EXECUTIVE]: [
    P.dashboardRead, P.customerRead, P.customerCreate, P.customerUpdate,
    P.productRead, P.inquiryRead, P.inquiryCreate, P.inquiryUpdate,
    P.quotationRead, P.quotationCreate, P.quotationUpdate,
    P.orderRead, P.orderCreate, P.orderUpdate, P.reportRead, P.aiUse,
  ],
  [ROLES.PRODUCTION_MANAGER]: [
    P.dashboardRead, P.analyticsRead, P.productRead, P.rawmaterialRead, P.inventoryRead,
    P.orderRead, P.productionRead, P.productionCreate, P.productionUpdate, P.productionRelease,
    P.machineRead, P.machineUpdate, P.maintenanceRead, P.maintenanceCreate,
    P.qualityRead, P.reportRead, P.reportExport, P.aiUse,
  ],
  [ROLES.OPERATOR]: [
    P.dashboardRead, P.productionRead, P.productionExecute, P.machineRead, P.machineUpdate,
  ],
  [ROLES.QUALITY_INSPECTOR]: [
    P.dashboardRead, P.productionRead, P.qualityRead, P.qualityCreate, P.qualityUpdate, P.qualityApprove,
    P.productRead, P.reportRead, P.aiUse,
  ],
  [ROLES.PURCHASE_MANAGER]: [
    P.dashboardRead, P.supplierRead, P.supplierCreate, P.supplierUpdate,
    P.rawmaterialRead, P.inventoryRead, P.purchaseRead, P.purchaseCreate, P.purchaseUpdate, P.purchaseReceive,
    P.reportRead, P.reportExport, P.aiUse,
  ],
  [ROLES.STORE_MANAGER]: [
    P.dashboardRead, P.inventoryRead, P.inventoryUpdate, P.rawmaterialRead, P.productRead,
    P.purchaseReceive, P.dispatchRead, P.dispatchCreate, P.reportRead, P.aiUse,
  ],
  [ROLES.FINANCE]: [
    P.dashboardRead, P.analyticsRead, P.invoiceRead, P.invoiceCreate, P.invoiceUpdate,
    P.paymentRead, P.paymentCreate, P.orderRead, P.customerRead,
    P.reportRead, P.reportExport, P.aiUse,
  ],
  [ROLES.HR]: [
    P.dashboardRead, P.employeeRead, P.employeeCreate, P.employeeUpdate,
    P.attendanceRead, P.attendanceCreate, P.leaveRead, P.leaveCreate, P.leaveApprove,
    P.reportRead, P.aiUse,
  ],
};
