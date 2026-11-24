import { productCreateSchema, productUpdateSchema, UNITS, PERMISSIONS } from "@techforge/shared";
import { ResourceManager } from "@/components/common/ResourceManager";
import { ActiveBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/common/DataTable";
import type { FieldConfig } from "@/components/common/AutoForm";
import { formatMoney, formatNumber } from "@/lib/utils";

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  unit: string;
  unitPrice: number;
  reorderPoint: number;
  isActive: boolean;
}

const unitOptions = UNITS.map((u) => ({ value: u, label: u }));

const columns: Column<Product>[] = [
  { key: "sku", header: "SKU", sortable: true, className: "font-mono text-xs text-muted-foreground" },
  {
    key: "name",
    header: "Product",
    sortable: true,
    render: (r) => (
      <div>
        <div className="font-medium text-foreground">{r.name}</div>
        {r.category && <div className="text-xs text-muted-foreground">{r.category}</div>}
      </div>
    ),
  },
  { key: "unit", header: "Unit", render: (r) => <Badge variant="secondary">{r.unit}</Badge> },
  { key: "unitPrice", header: "Price", sortable: true, align: "right", render: (r) => formatMoney(r.unitPrice) },
  { key: "reorderPoint", header: "Reorder pt", align: "right", render: (r) => formatNumber(r.reorderPoint) },
  { key: "isActive", header: "Status", render: (r) => <ActiveBadge active={r.isActive} /> },
];

const fields: FieldConfig[] = [
  { name: "sku", label: "SKU", placeholder: "FG-XXX-000" },
  { name: "name", label: "Product name", placeholder: "1 HP Induction Motor" },
  { name: "category", label: "Category", placeholder: "Motors" },
  { name: "unit", label: "Unit", type: "select", options: unitOptions },
  { name: "unitPrice", label: "Unit price", type: "number", prefix: "₹" },
  { name: "reorderPoint", label: "Reorder point", type: "number" },
  { name: "description", label: "Description", type: "textarea", colSpan: 2 },
  { name: "isActive", label: "Active", type: "switch" },
];

export function ProductsPage() {
  return (
    <ResourceManager<Product, typeof productCreateSchema._type>
      resource="products"
      title="Products"
      description="Finished goods you manufacture and sell."
      singular="Product"
      columns={columns}
      fields={fields}
      createSchema={productCreateSchema}
      updateSchema={productUpdateSchema}
      defaultSort="name:asc"
      searchPlaceholder="Search SKU, name, category…"
      emptyValues={{
        sku: "",
        name: "",
        description: "",
        category: "",
        unit: "pcs",
        unitPrice: 0,
        reorderPoint: 0,
        isActive: true,
      }}
      toFormValues={(r) => ({
        sku: r.sku,
        name: r.name,
        description: r.description ?? "",
        category: r.category ?? "",
        unit: r.unit as (typeof UNITS)[number],
        unitPrice: r.unitPrice,
        reorderPoint: r.reorderPoint,
        isActive: r.isActive,
      })}
      permissions={{
        create: PERMISSIONS.productCreate,
        update: PERMISSIONS.productUpdate,
        delete: PERMISSIONS.productDelete,
      }}
    />
  );
}
