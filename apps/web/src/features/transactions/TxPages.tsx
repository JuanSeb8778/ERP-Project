import {
  machine, employee, inquiry, quotation, salesOrder, purchaseOrder, invoice, payment, inspection, productionOrder,
  MACHINE_STATUSES, EMPLOYEE_STATUSES, INQUIRY_STATUSES, QUOTATION_STATUSES, SALES_ORDER_STATUSES,
  PURCHASE_ORDER_STATUSES, INVOICE_STATUSES, PAYMENT_METHODS, INSPECTION_TYPES, INSPECTION_STATUSES,
  PRODUCTION_STATUSES, PERMISSIONS,
} from "@techforge/shared";
import { ResourceManager } from "@/components/common/ResourceManager";
import { AutoStatusBadge } from "@/components/common/StatusBadge";
import type { Column } from "@/components/common/DataTable";
import type { FieldConfig } from "@/components/common/AutoForm";
import { useList } from "@/hooks/useResource";
import { formatMoney } from "@/lib/utils";

const sel = (arr: readonly string[]) => arr.map((s) => ({ value: s, label: s.replace(/_/g, " ") }));
function useOpts(resource: string, label: (x: Record<string, unknown>) => string) {
  const q = useList<Record<string, unknown>>(resource, { pageSize: 200, sort: "name:asc" });
  return (q.data?.data ?? []).map((x) => ({ value: x.id as string, label: label(x) }));
}
const numCol = (key: string, header: string): Column<Record<string, unknown>> => ({
  key, header, align: "right", render: (r) => formatMoney(r[key] as number),
});

/* ───────────── Machines (Phase 4) ───────────── */
export function MachinesPage() {
  const cols: Column<any>[] = [
    { key: "code", header: "Code", sortable: true, className: "font-mono text-xs text-muted-foreground" },
    { key: "name", header: "Machine", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", render: (r) => r.type || "—" },
    { key: "status", header: "Status", sortable: true, render: (r) => <AutoStatusBadge status={r.status} /> },
    { key: "location", header: "Location", render: (r) => r.location || "—" },
  ];
  const fields: FieldConfig[] = [
    { name: "code", label: "Code", placeholder: "MC-001" },
    { name: "name", label: "Machine name" },
    { name: "type", label: "Type", placeholder: "CNC / Lathe / …" },
    { name: "status", label: "Status", type: "select", options: sel(MACHINE_STATUSES) },
    { name: "location", label: "Location" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
    { name: "isActive", label: "Active", type: "switch" },
  ];
  return (
    <ResourceManager<any, any>
      resource="machines" title="Machines" singular="Machine"
      description="Shop-floor equipment and live status."
      columns={cols} fields={fields} createSchema={machine.create} updateSchema={machine.update}
      defaultSort="name:asc" searchPlaceholder="Search machines…"
      emptyValues={{ code: "", name: "", type: "", status: "IDLE", location: "", notes: "", isActive: true }}
      toFormValues={(r) => ({ code: r.code, name: r.name, type: r.type ?? "", status: r.status, location: r.location ?? "", notes: r.notes ?? "", isActive: r.isActive })}
      permissions={{ create: PERMISSIONS.machineCreate, update: PERMISSIONS.machineUpdate, delete: PERMISSIONS.machineUpdate }}
    />
  );
}

/* ───────────── Employees (Phase 6 · HR) ───────────── */
export function EmployeesPage() {
  const cols: Column<any>[] = [
    { key: "code", header: "Code", sortable: true, className: "font-mono text-xs text-muted-foreground" },
    { key: "name", header: "Employee", sortable: true, render: (r) => <span className="font-medium">{r.firstName} {r.lastName}</span> },
    { key: "department", header: "Department", render: (r) => r.department || "—" },
    { key: "designation", header: "Designation", render: (r) => r.designation || "—" },
    { key: "status", header: "Status", render: (r) => <AutoStatusBadge status={r.status} /> },
  ];
  const fields: FieldConfig[] = [
    { name: "code", label: "Employee code", placeholder: "EMP-001" },
    { name: "firstName", label: "First name" },
    { name: "lastName", label: "Last name" },
    { name: "department", label: "Department", placeholder: "Production" },
    { name: "designation", label: "Designation", placeholder: "Operator" },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "dateOfJoining", label: "Joining date", placeholder: "YYYY-MM-DD" },
    { name: "status", label: "Status", type: "select", options: sel(EMPLOYEE_STATUSES) },
    { name: "isActive", label: "Active", type: "switch" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="employees" title="Employees" singular="Employee"
      description="Your workforce — departments, roles and status."
      columns={cols} fields={fields} createSchema={employee.create} updateSchema={employee.update}
      defaultSort="firstName:asc" searchPlaceholder="Search employees…"
      emptyValues={{ code: "", firstName: "", lastName: "", department: "", designation: "", email: "", phone: "", dateOfJoining: "", status: "ACTIVE", notes: "", isActive: true }}
      toFormValues={(r) => ({ code: r.code, firstName: r.firstName, lastName: r.lastName, department: r.department ?? "", designation: r.designation ?? "", email: r.email ?? "", phone: r.phone ?? "", dateOfJoining: r.dateOfJoining ? String(r.dateOfJoining).slice(0, 10) : "", status: r.status, notes: r.notes ?? "", isActive: r.isActive })}
      permissions={{ create: PERMISSIONS.employeeCreate, update: PERMISSIONS.employeeUpdate, delete: PERMISSIONS.employeeUpdate }}
    />
  );
}

/* ───────────── Inquiries (Phase 3) ───────────── */
export function InquiriesPage() {
  const customers = useOpts("customers", (x) => x.name as string);
  const cols: Column<any>[] = [
    { key: "number", header: "Inquiry #", sortable: true, className: "font-mono text-xs" },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? "—" },
    { key: "subject", header: "Subject", render: (r) => <span className="font-medium">{r.subject}</span> },
    { key: "status", header: "Status", sortable: true, render: (r) => <AutoStatusBadge status={r.status} /> },
  ];
  const fields: FieldConfig[] = [
    { name: "number", label: "Inquiry number", placeholder: "INQ-001" },
    { name: "customerId", label: "Customer", type: "select", options: customers },
    { name: "subject", label: "Subject", colSpan: 2 },
    { name: "status", label: "Status", type: "select", options: sel(INQUIRY_STATUSES) },
    { name: "expectedDate", label: "Expected date", placeholder: "YYYY-MM-DD" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="inquiries" title="Inquiries" singular="Inquiry"
      description="Incoming customer inquiries — the top of the sales funnel."
      columns={cols} fields={fields} createSchema={inquiry.create} updateSchema={inquiry.update}
      fieldOptions={{ customerId: customers }} searchPlaceholder="Search inquiries…"
      emptyValues={{ number: "", customerId: "", subject: "", status: "OPEN", expectedDate: "", notes: "" }}
      toFormValues={(r) => ({ number: r.number, customerId: r.customerId, subject: r.subject, status: r.status, expectedDate: r.expectedDate ? String(r.expectedDate).slice(0, 10) : "", notes: r.notes ?? "" })}
      permissions={{ create: PERMISSIONS.inquiryCreate, update: PERMISSIONS.inquiryUpdate, delete: PERMISSIONS.inquiryUpdate }}
    />
  );
}

/* ───────────── Quotations (Phase 3) ───────────── */
export function QuotationsPage() {
  const customers = useOpts("customers", (x) => x.name as string);
  const cols: Column<any>[] = [
    { key: "number", header: "Quote #", sortable: true, className: "font-mono text-xs" },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? "—" },
    { key: "status", header: "Status", sortable: true, render: (r) => <AutoStatusBadge status={r.status} /> },
    numCol("total", "Total"),
  ];
  const fields: FieldConfig[] = [
    { name: "number", label: "Quote number", placeholder: "QT-001" },
    { name: "customerId", label: "Customer", type: "select", options: customers },
    { name: "status", label: "Status", type: "select", options: sel(QUOTATION_STATUSES) },
    { name: "validUntil", label: "Valid until", placeholder: "YYYY-MM-DD" },
    { name: "subtotal", label: "Subtotal", type: "number", prefix: "₹" },
    { name: "taxPct", label: "Tax %", type: "number" },
    { name: "total", label: "Total", type: "number", prefix: "₹" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="quotations" title="Quotations" singular="Quotation"
      description="Price quotes issued to customers."
      columns={cols} fields={fields} createSchema={quotation.create} updateSchema={quotation.update}
      fieldOptions={{ customerId: customers }} searchPlaceholder="Search quotations…"
      emptyValues={{ number: "", customerId: "", status: "DRAFT", validUntil: "", subtotal: 0, taxPct: 18, total: 0, notes: "" }}
      toFormValues={(r) => ({ number: r.number, customerId: r.customerId, status: r.status, validUntil: r.validUntil ? String(r.validUntil).slice(0, 10) : "", subtotal: r.subtotal, taxPct: r.taxPct, total: r.total, notes: r.notes ?? "" })}
      permissions={{ create: PERMISSIONS.quotationCreate, update: PERMISSIONS.quotationUpdate, delete: PERMISSIONS.quotationUpdate }}
    />
  );
}

/* ───────────── Sales Orders (Phase 3) ───────────── */
export function SalesOrdersPage() {
  const customers = useOpts("customers", (x) => x.name as string);
  const cols: Column<any>[] = [
    { key: "number", header: "Order #", sortable: true, className: "font-mono text-xs" },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? "—" },
    { key: "status", header: "Status", sortable: true, render: (r) => <AutoStatusBadge status={r.status} /> },
    numCol("total", "Total"),
  ];
  const fields: FieldConfig[] = [
    { name: "number", label: "Order number", placeholder: "SO-001" },
    { name: "customerId", label: "Customer", type: "select", options: customers },
    { name: "status", label: "Status", type: "select", options: sel(SALES_ORDER_STATUSES) },
    { name: "total", label: "Total", type: "number", prefix: "₹" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="orders" title="Sales Orders" singular="Order"
      description="Confirmed customer orders flowing into production."
      columns={cols} fields={fields} createSchema={salesOrder.create} updateSchema={salesOrder.update}
      fieldOptions={{ customerId: customers }} searchPlaceholder="Search orders…"
      emptyValues={{ number: "", customerId: "", status: "CONFIRMED", total: 0, notes: "" }}
      toFormValues={(r) => ({ number: r.number, customerId: r.customerId, status: r.status, total: r.total, notes: r.notes ?? "" })}
      permissions={{ create: PERMISSIONS.orderCreate, update: PERMISSIONS.orderUpdate, delete: PERMISSIONS.orderUpdate }}
    />
  );
}

/* ───────────── Purchase Orders (Phase 5) ───────────── */
export function PurchaseOrdersPage() {
  const suppliers = useOpts("suppliers", (x) => x.name as string);
  const cols: Column<any>[] = [
    { key: "number", header: "PO #", sortable: true, className: "font-mono text-xs" },
    { key: "supplier", header: "Supplier", render: (r) => r.supplier?.name ?? "—" },
    { key: "status", header: "Status", sortable: true, render: (r) => <AutoStatusBadge status={r.status} /> },
    numCol("total", "Total"),
  ];
  const fields: FieldConfig[] = [
    { name: "number", label: "PO number", placeholder: "PO-001" },
    { name: "supplierId", label: "Supplier", type: "select", options: suppliers },
    { name: "status", label: "Status", type: "select", options: sel(PURCHASE_ORDER_STATUSES) },
    { name: "total", label: "Total", type: "number", prefix: "₹" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="purchase-orders" title="Purchasing" singular="Purchase Order"
      description="Orders raised on suppliers for raw materials."
      columns={cols} fields={fields} createSchema={purchaseOrder.create} updateSchema={purchaseOrder.update}
      fieldOptions={{ supplierId: suppliers }} searchPlaceholder="Search purchase orders…"
      emptyValues={{ number: "", supplierId: "", status: "DRAFT", total: 0, notes: "" }}
      toFormValues={(r) => ({ number: r.number, supplierId: r.supplierId, status: r.status, total: r.total, notes: r.notes ?? "" })}
      permissions={{ create: PERMISSIONS.purchaseCreate, update: PERMISSIONS.purchaseUpdate, delete: PERMISSIONS.purchaseUpdate }}
    />
  );
}

/* ───────────── Invoices (Phase 5) ───────────── */
export function InvoicesPage() {
  const customers = useOpts("customers", (x) => x.name as string);
  const cols: Column<any>[] = [
    { key: "number", header: "Invoice #", sortable: true, className: "font-mono text-xs" },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? "—" },
    { key: "status", header: "Status", sortable: true, render: (r) => <AutoStatusBadge status={r.status} /> },
    numCol("total", "Total"),
    numCol("amountPaid", "Paid"),
  ];
  const fields: FieldConfig[] = [
    { name: "number", label: "Invoice number", placeholder: "INV-001" },
    { name: "customerId", label: "Customer", type: "select", options: customers },
    { name: "status", label: "Status", type: "select", options: sel(INVOICE_STATUSES) },
    { name: "dueDate", label: "Due date", placeholder: "YYYY-MM-DD" },
    { name: "total", label: "Total", type: "number", prefix: "₹" },
    { name: "amountPaid", label: "Amount paid", type: "number", prefix: "₹" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="invoices" title="Invoices" singular="Invoice"
      description="Customer invoices and their payment status."
      columns={cols} fields={fields} createSchema={invoice.create} updateSchema={invoice.update}
      fieldOptions={{ customerId: customers }} searchPlaceholder="Search invoices…"
      emptyValues={{ number: "", customerId: "", status: "ISSUED", dueDate: "", total: 0, amountPaid: 0, notes: "" }}
      toFormValues={(r) => ({ number: r.number, customerId: r.customerId, status: r.status, dueDate: r.dueDate ? String(r.dueDate).slice(0, 10) : "", total: r.total, amountPaid: r.amountPaid, notes: r.notes ?? "" })}
      permissions={{ create: PERMISSIONS.invoiceCreate, update: PERMISSIONS.invoiceUpdate, delete: PERMISSIONS.invoiceUpdate }}
    />
  );
}

/* ───────────── Payments (Phase 5) ───────────── */
export function PaymentsPage() {
  const customers = useOpts("customers", (x) => x.name as string);
  const cols: Column<any>[] = [
    { key: "number", header: "Payment #", sortable: true, className: "font-mono text-xs" },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? "—" },
    { key: "method", header: "Method", render: (r) => r.method },
    numCol("amount", "Amount"),
  ];
  const fields: FieldConfig[] = [
    { name: "number", label: "Payment number", placeholder: "PAY-001" },
    { name: "customerId", label: "Customer", type: "select", options: customers },
    { name: "amount", label: "Amount", type: "number", prefix: "₹" },
    { name: "method", label: "Method", type: "select", options: sel(PAYMENT_METHODS) },
    { name: "reference", label: "Reference", placeholder: "UTR / cheque no." },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="payments" title="Payments" singular="Payment"
      description="Payments received against invoices."
      columns={cols} fields={fields} createSchema={payment.create} updateSchema={payment.update}
      fieldOptions={{ customerId: customers }} searchPlaceholder="Search payments…"
      emptyValues={{ number: "", customerId: "", amount: 0, method: "BANK", reference: "", notes: "" }}
      toFormValues={(r) => ({ number: r.number, customerId: r.customerId, amount: r.amount, method: r.method, reference: r.reference ?? "", notes: r.notes ?? "" })}
      permissions={{ create: PERMISSIONS.paymentCreate, update: PERMISSIONS.paymentCreate, delete: PERMISSIONS.paymentCreate }}
    />
  );
}

/* ───────────── Quality Inspections (Phase 5) ───────────── */
export function InspectionsPage() {
  const cols: Column<any>[] = [
    { key: "number", header: "Inspection #", sortable: true, className: "font-mono text-xs" },
    { key: "type", header: "Type", render: (r) => r.type.replace(/_/g, " ") },
    { key: "status", header: "Result", sortable: true, render: (r) => <AutoStatusBadge status={r.status} /> },
    { key: "reference", header: "Reference", render: (r) => r.reference || "—" },
  ];
  const fields: FieldConfig[] = [
    { name: "number", label: "Inspection number", placeholder: "QC-001" },
    { name: "type", label: "Type", type: "select", options: sel(INSPECTION_TYPES) },
    { name: "status", label: "Result", type: "select", options: sel(INSPECTION_STATUSES) },
    { name: "reference", label: "Reference", placeholder: "WO / GRN / lot" },
    { name: "result", label: "Findings", type: "textarea", colSpan: 2 },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="inspections" title="Quality" singular="Inspection"
      description="Incoming, in-process and final quality inspections."
      columns={cols} fields={fields} createSchema={inspection.create} updateSchema={inspection.update}
      searchPlaceholder="Search inspections…"
      emptyValues={{ number: "", type: "INCOMING", status: "PENDING", reference: "", result: "", notes: "" }}
      toFormValues={(r) => ({ number: r.number, type: r.type, status: r.status, reference: r.reference ?? "", result: r.result ?? "", notes: r.notes ?? "" })}
      permissions={{ create: PERMISSIONS.qualityCreate, update: PERMISSIONS.qualityUpdate, delete: PERMISSIONS.qualityUpdate }}
    />
  );
}

/* ───────────── Production Orders (Phase 4) ───────────── */
export function ProductionPage() {
  const products = useOpts("products", (x) => `${x.name} (${x.sku})`);
  const cols: Column<any>[] = [
    { key: "number", header: "Order #", sortable: true, className: "font-mono text-xs" },
    { key: "product", header: "Product", render: (r) => r.product?.name ?? "—" },
    { key: "quantity", header: "Qty", align: "right", render: (r) => r.quantity },
    { key: "status", header: "Status", sortable: true, render: (r) => <AutoStatusBadge status={r.status} /> },
  ];
  const fields: FieldConfig[] = [
    { name: "number", label: "Order number", placeholder: "PRD-001" },
    { name: "productId", label: "Product", type: "select", options: products },
    { name: "quantity", label: "Quantity", type: "number" },
    { name: "status", label: "Status", type: "select", options: sel(PRODUCTION_STATUSES) },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];
  return (
    <ResourceManager<any, any>
      resource="production-orders" title="Production" singular="Production Order"
      description="Manufacturing work orders and their progress."
      columns={cols} fields={fields} createSchema={productionOrder.create} updateSchema={productionOrder.update}
      fieldOptions={{ productId: products }} searchPlaceholder="Search production orders…"
      emptyValues={{ number: "", productId: "", quantity: 1, status: "PLANNED", notes: "" }}
      toFormValues={(r) => ({ number: r.number, productId: r.productId, quantity: r.quantity, status: r.status, notes: r.notes ?? "" })}
      permissions={{ create: PERMISSIONS.productionCreate, update: PERMISSIONS.productionUpdate, delete: PERMISSIONS.productionUpdate }}
    />
  );
}
