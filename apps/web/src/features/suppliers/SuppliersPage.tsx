import { supplierCreateSchema, supplierUpdateSchema, PERMISSIONS } from "@techforge/shared";
import { ResourceManager } from "@/components/common/ResourceManager";
import { ActiveBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/common/DataTable";
import type { FieldConfig } from "@/components/common/AutoForm";

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  leadTimeDays: number;
  rating?: number | null;
  notes?: string | null;
  isActive: boolean;
}

const columns: Column<Supplier>[] = [
  { key: "code", header: "Code", sortable: true, className: "font-mono text-xs text-muted-foreground" },
  {
    key: "name",
    header: "Supplier",
    sortable: true,
    render: (r) => (
      <div>
        <div className="font-medium text-foreground">{r.name}</div>
        {r.contactPerson && <div className="text-xs text-muted-foreground">{r.contactPerson}</div>}
      </div>
    ),
  },
  { key: "city", header: "Location", render: (r) => [r.city, r.state].filter(Boolean).join(", ") || "—" },
  { key: "leadTimeDays", header: "Lead time", sortable: true, align: "right", render: (r) => `${r.leadTimeDays} d` },
  {
    key: "rating",
    header: "Rating",
    sortable: true,
    render: (r) => (r.rating ? <Badge variant="info">★ {r.rating}/5</Badge> : "—"),
  },
  { key: "isActive", header: "Status", render: (r) => <ActiveBadge active={r.isActive} /> },
];

const fields: FieldConfig[] = [
  { name: "code", label: "Code", placeholder: "SUP-005" },
  { name: "name", label: "Supplier name", placeholder: "Metro Copper & Alloys" },
  { name: "contactPerson", label: "Contact person" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "gstin", label: "GSTIN" },
  { name: "address", label: "Address", type: "textarea", colSpan: 2 },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "leadTimeDays", label: "Lead time (days)", type: "number" },
  { name: "rating", label: "Rating (1–5)", type: "number" },
  { name: "isActive", label: "Active", type: "switch" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export function SuppliersPage() {
  return (
    <ResourceManager<Supplier, typeof supplierCreateSchema._type>
      resource="suppliers"
      title="Suppliers"
      description="Vendors you buy raw materials from — lead times and ratings."
      singular="Supplier"
      columns={columns}
      fields={fields}
      createSchema={supplierCreateSchema}
      updateSchema={supplierUpdateSchema}
      defaultSort="name:asc"
      searchPlaceholder="Search name, code, city…"
      emptyValues={{
        code: "",
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        gstin: "",
        address: "",
        city: "",
        state: "",
        leadTimeDays: 7,
        rating: undefined,
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
        address: r.address ?? "",
        city: r.city ?? "",
        state: r.state ?? "",
        leadTimeDays: r.leadTimeDays,
        rating: r.rating ?? undefined,
        notes: r.notes ?? "",
        isActive: r.isActive,
      })}
      permissions={{
        create: PERMISSIONS.supplierCreate,
        update: PERMISSIONS.supplierUpdate,
        delete: PERMISSIONS.supplierDelete,
      }}
    />
  );
}
