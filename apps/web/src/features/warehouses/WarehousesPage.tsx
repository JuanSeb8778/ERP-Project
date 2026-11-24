import { warehouseCreateSchema, warehouseUpdateSchema, PERMISSIONS } from "@techforge/shared";
import { ResourceManager } from "@/components/common/ResourceManager";
import { ActiveBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/common/DataTable";
import type { FieldConfig } from "@/components/common/AutoForm";

interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

const columns: Column<Warehouse>[] = [
  { key: "code", header: "Code", sortable: true, className: "font-mono text-xs text-muted-foreground" },
  {
    key: "name",
    header: "Warehouse",
    sortable: true,
    render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{r.name}</span>
        {r.isDefault && <Badge variant="info">Default</Badge>}
      </div>
    ),
  },
  { key: "location", header: "Location", render: (r) => r.location || "—" },
  { key: "isActive", header: "Status", render: (r) => <ActiveBadge active={r.isActive} /> },
];

const fields: FieldConfig[] = [
  { name: "code", label: "Code", placeholder: "WH-XXX" },
  { name: "name", label: "Warehouse name", placeholder: "Main Store" },
  { name: "location", label: "Location", colSpan: 2, placeholder: "Plant 1 · Block A" },
  { name: "isDefault", label: "Default warehouse", type: "switch" },
  { name: "isActive", label: "Active", type: "switch" },
];

export function WarehousesPage() {
  return (
    <ResourceManager<Warehouse, typeof warehouseCreateSchema._type>
      resource="warehouses"
      title="Warehouses"
      description="Storage locations that hold stock."
      singular="Warehouse"
      columns={columns}
      fields={fields}
      createSchema={warehouseCreateSchema}
      updateSchema={warehouseUpdateSchema}
      defaultSort="name:asc"
      searchPlaceholder="Search code, name…"
      emptyValues={{ code: "", name: "", location: "", isDefault: false, isActive: true }}
      toFormValues={(r) => ({
        code: r.code,
        name: r.name,
        location: r.location ?? "",
        isDefault: r.isDefault,
        isActive: r.isActive,
      })}
      permissions={{
        create: PERMISSIONS.inventoryUpdate,
        update: PERMISSIONS.inventoryUpdate,
        delete: PERMISSIONS.inventoryUpdate,
      }}
    />
  );
}
