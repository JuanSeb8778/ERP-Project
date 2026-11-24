import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Boxes,
  Factory,
  Cpu,
  ShieldCheck,
  Truck,
  Receipt,
  UserCog,
  BarChart3,
  Settings,
  Sparkles,
  Building2,
  Layers,
  Warehouse,
  MessageSquare,
  FileText,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type PermissionKey } from "@techforge/shared";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** If set, the item is shown only when the user holds this permission. */
  permission?: PermissionKey;
  /** Phase in which the destination page ships; used to mark "coming soon". */
  ready?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Single source of truth for sidebar navigation. Items are filtered by permission,
 * so the menu always reflects what the signed-in role can actually do.
 */
export const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard, permission: PERMISSIONS.dashboardRead, ready: true },
      { label: "AI Assistant", to: "/assistant", icon: Sparkles, permission: PERMISSIONS.aiUse },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Inquiries", to: "/inquiries", icon: MessageSquare, permission: PERMISSIONS.inquiryRead, ready: true },
      { label: "Quotations", to: "/quotations", icon: FileText, permission: PERMISSIONS.quotationRead, ready: true },
      { label: "Orders", to: "/orders", icon: ShoppingCart, permission: PERMISSIONS.orderRead, ready: true },
      { label: "Customers", to: "/customers", icon: Users, permission: PERMISSIONS.customerRead, ready: true },
    ],
  },
  {
    title: "Master Data",
    items: [
      { label: "Products", to: "/products", icon: Package, permission: PERMISSIONS.productRead, ready: true },
      { label: "Raw Materials", to: "/raw-materials", icon: Layers, permission: PERMISSIONS.rawmaterialRead, ready: true },
      { label: "Suppliers", to: "/suppliers", icon: Building2, permission: PERMISSIONS.supplierRead, ready: true },
      { label: "BOM", to: "/bom", icon: Layers, permission: PERMISSIONS.productRead, ready: true },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Inventory", to: "/inventory", icon: Boxes, permission: PERMISSIONS.inventoryRead, ready: true },
      { label: "Warehouses", to: "/warehouses", icon: Warehouse, permission: PERMISSIONS.inventoryRead, ready: true },
      { label: "Production", to: "/production", icon: Factory, permission: PERMISSIONS.productionRead, ready: true },
      { label: "Machines", to: "/machines", icon: Cpu, permission: PERMISSIONS.machineRead, ready: true },
      { label: "Quality", to: "/quality", icon: ShieldCheck, permission: PERMISSIONS.qualityRead, ready: true },
      { label: "Purchasing", to: "/purchasing", icon: Truck, permission: PERMISSIONS.purchaseRead, ready: true },
    ],
  },
  {
    title: "Finance & HR",
    items: [
      { label: "Invoices", to: "/invoices", icon: Receipt, permission: PERMISSIONS.invoiceRead, ready: true },
      { label: "Payments", to: "/payments", icon: Wallet, permission: PERMISSIONS.paymentRead, ready: true },
      { label: "HR", to: "/hr", icon: UserCog, permission: PERMISSIONS.employeeRead, ready: true },
      { label: "Reports", to: "/reports", icon: BarChart3, permission: PERMISSIONS.reportRead, ready: true },
    ],
  },
  {
    title: "System",
    items: [{ label: "Settings", to: "/settings", icon: Settings, permission: PERMISSIONS.companyRead, ready: true }],
  },
];
