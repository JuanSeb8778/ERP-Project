import { customerCreateSchema, customerUpdateSchema, PERMISSIONS } from "@techforge/shared";
import { ResourceManager } from "@/components/common/ResourceManager";
import { ActiveBadge } from "@/components/common/StatusBadge";
import type { Column } from "@/components/common/DataTable";
import type { FieldConfig } from "@/components/common/AutoForm";
import { formatMoney } from "@/lib/utils";

interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  billingAddress?: string | null;
  city?: string | null;
  state?: string | null;
  creditLimit: number;
  notes?: string | null;
  isActive: boolean;
}

const columns: Column<Customer>[] = [
  { key: "code", header: "Code", sortable: true, className: "font-mono text-xs text-muted-foreground" },
  {
    key: "name",
    header: "Customer",
    sortable: true,
    render: (r) => (
      <div>
        <div className="font-medium text-foreground">{r.name}</div>
        {r.contactPerson && <div className="text-xs text-muted-foreground">{r.contactPerson}</div>}
      </div>
    ),
  },
  { key: "city", header: "Location", render: (r) => [r.city, r.state].filter(Boolean).join(", ") || "—" },
  { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
  { key: "creditLimit", header: "Credit Limit", sortable: true, align: "right", render: (r) => formatMoney(r.creditLimit) },
  { key: "isActive", header: "Status", render: (r) => <ActiveBadge active={r.isActive} /> },
];

const fields: FieldConfig[] = [
  { name: "code", label: "Code", placeholder: "CUST-006" },
  { name: "name", label: "Company name", placeholder: "Acme Industries" },
  { name: "contactPerson", label: "Contact person", placeholder: "Full name" },
  { name: "email", label: "Email", type: "email", placeholder: "name@company.com" },
  { name: "phone", label: "Phone", placeholder: "+91 …" },
  { name: "gstin", label: "GSTIN", placeholder: "22AAAAA0000A1Z5" },
  { name: "billingAddress", label: "Billing address", type: "textarea", colSpan: 2 },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "creditLimit", label: "Credit limit", type: "number", prefix: "₹" },
  { name: "isActive", label: "Active", type: "switch" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export function CustomersPage() {
  return (
    <ResourceManager<Customer, typeof customerCreateSchema._type>
      resource="customers"
      title="Customers"
      description="Companies you sell to — contacts, credit limits and billing details."
      singular="Customer"
      columns={columns}
      fields={fields}
      createSchema={customerCreateSchema}
      updateSchema={customerUpdateSchema}
      defaultSort="name:asc"
      searchPlaceholder="Search name, code, city…"
      emptyValues={{
        code: "",
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        gstin: "",
        billingAddress: "",
        city: "",
        state: "",
        creditLimit: 0,
        notes: "",
        isActive: true,
      }}
      toFormValues={(r) => ({
        code: r.code,
        name: r.name,
        contactPerson: r.contactPerson ?? "",
        email: r.email ?? "",
        phone: r.phone ?? "",
        gstin: r.gstin ?? "",
        billingAddress: r.billingAddress ?? "",
        city: r.city ?? "",
        state: r.state ?? "",
        creditLimit: r.creditLimit,
        notes: r.notes ?? "",
        isActive: r.isActive,
      })}
      permissions={{
        create: PERMISSIONS.customerCreate,
        update: PERMISSIONS.customerUpdate,
        delete: PERMISSIONS.customerDelete,
      }}
    />
  );
}
