/** The nine business roles. Roles are data (seeded), but these keys are the canonical names. */
export const ROLES = {
  ADMIN: "ADMIN",
  PRODUCTION_MANAGER: "PRODUCTION_MANAGER",
  QUALITY_INSPECTOR: "QUALITY_INSPECTOR",
  PURCHASE_MANAGER: "PURCHASE_MANAGER",
  STORE_MANAGER: "STORE_MANAGER",
  SALES_EXECUTIVE: "SALES_EXECUTIVE",
  OPERATOR: "OPERATOR",
  HR: "HR",
  FINANCE: "FINANCE",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Admin",
  PRODUCTION_MANAGER: "Production Manager",
  QUALITY_INSPECTOR: "Quality Inspector",
  PURCHASE_MANAGER: "Purchase Manager",
  STORE_MANAGER: "Store Manager",
  SALES_EXECUTIVE: "Sales Executive",
  OPERATOR: "Operator",
  HR: "HR",
  FINANCE: "Finance",
};
