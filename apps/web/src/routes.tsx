import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { SuppliersPage } from "@/features/suppliers/SuppliersPage";
import { ProductsPage } from "@/features/products/ProductsPage";
import { RawMaterialsPage } from "@/features/rawMaterials/RawMaterialsPage";
import { WarehousesPage } from "@/features/warehouses/WarehousesPage";
import { InventoryPage } from "@/features/inventory/InventoryPage";
import { BomPage } from "@/features/bom/BomPage";
import {
  MachinesPage, EmployeesPage, InquiriesPage, QuotationsPage, SalesOrdersPage,
  PurchaseOrdersPage, InvoicesPage, PaymentsPage, InspectionsPage, ProductionPage,
} from "@/features/transactions/TxPages";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";
import { AssistantPage } from "@/features/assistant/AssistantPage";
import { SettingsPage } from "@/features/settings/SettingsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "assistant", element: <AssistantPage /> },
      // Master data & inventory
      { path: "customers", element: <CustomersPage /> },
      { path: "suppliers", element: <SuppliersPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "raw-materials", element: <RawMaterialsPage /> },
      { path: "warehouses", element: <WarehousesPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "bom", element: <BomPage /> },
      // Sales
      { path: "inquiries", element: <InquiriesPage /> },
      { path: "quotations", element: <QuotationsPage /> },
      { path: "orders", element: <SalesOrdersPage /> },
      // Production & MES
      { path: "production", element: <ProductionPage /> },
      { path: "machines", element: <MachinesPage /> },
      { path: "quality", element: <InspectionsPage /> },
      // Purchasing & finance
      { path: "purchasing", element: <PurchaseOrdersPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "payments", element: <PaymentsPage /> },
      // HR, reports, settings
      { path: "hr", element: <EmployeesPage /> },
      { path: "reports", element: <AnalyticsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
