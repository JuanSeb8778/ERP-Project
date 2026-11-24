import { rawMaterialCreateSchema, rawMaterialUpdateSchema, UNITS, PERMISSIONS } from "@techforge/shared";
import { ResourceManager } from "@/components/common/ResourceManager";
import { ActiveBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/common/DataTable";
import type { FieldConfig } from "@/components/common/AutoForm";
import { formatMoney, formatNumber } from "@/lib/utils";

interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category?: string | null;
  unit: string;
  unitCost: number;
  reorderPoint: number;
  isActive: boolean;
}

const unitOptions = UNITS.map((u) => ({ value: u, label: u }));

const columns: Column<RawMaterial>[] = [
  { key: "code", header: "Code", sortable: true, className: "font-mono text-xs text-muted-foreground" },
  {
    key: "name",
    header: "Material",
    sortable: true,
    render: (r) => (
      <div>
        <div className="font-medium text-foreground">{r.name}</div>
        {r.category && <div className="text-xs text-muted-foreground">{r.category}</div>}
      </div>
    ),
  },
  { key: "unit", header: "Unit", render: (r) => <Badge variant="secondary">{r.unit}</Badge> },
  { key: "unitCost", header: "Unit cost", sortable: true, align: "right", render: (r) => formatMoney(r.unitCost) },
  { key: "reorderPoint", header: "Reorder pt", align: "right", render: (r) => formatNumber(r.reorderPoint) },
  { key: "isActive", header: "Status", render: (r) => <ActiveBadge active={r.isActive} /> },
];

const fields: FieldConfig[] = [
  { name: "code", label: "Code", placeholder: "RM-XXX" },
  { name: "name", label: "Material name", placeholder: "Copper Winding Wire" },
  { name: "category", label: "Category", placeholder: "Metals" },
  { name: "unit", label: "Unit", type: "select", options: unitOptions },
  { name: "unitCost", label: "Unit cost", type: "number", prefix: "₹" },
  { name: "reorderPoint", label: "Reorder point", type: "number" },
  { name: "isActive", label: "Active", type: "switch" },
];

export function RawMaterialsPage() {
  return (
    <ResourceManager<RawMaterial, typeof rawMaterialCreateSchema._type>
      resource="raw-materials"
      title="Raw Materials"
      description="Components and materials consumed in production."
      singular="Material"
      columns={columns}
      fields={fields}
      createSchema={rawMaterialCreateSchema}
      updateSchema={rawMaterialUpdateSchema}
      defaultSort="name:asc"
      searchPlaceholder="Search code, name, category…"
      emptyValues={{
        code: "",
        name: "",
        category: "",
        unit: "pcs",
        unitCost: 0,
        reorderPoint: 0,
        isActive: true,
      }}
      toFormValues={(r) => ({
        code: r.code,
        name: r.name,
        category: r.category ?? "",
        unit: r.unit as (typeof UNITS)[number],
        unitCost: r.unitCost,
        reorderPoint: r.reorderPoint,
        isActive: r.isActive,
      })}
      permissions={{
        create: PERMISSIONS.rawmaterialCreate,
        update: PERMISSIONS.rawmaterialUpdate,
        delete: PERMISSIONS.rawmaterialDelete,
      }}
    />
  );
}
