import { useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Loader2, Layers } from "lucide-react";
import { bomCreateSchema, PERMISSIONS, type BomInput } from "@techforge/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ActiveBadge } from "@/components/common/StatusBadge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useList, useTableParams } from "@/hooks/useResource";
import { api, apiErrorMessage } from "@/lib/api";
import { formatMoney, cn } from "@/lib/utils";

interface BomListRow {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  product: { sku: string; name: string };
  _count: { components: number };
}
interface Product { id: string; name: string; sku: string }
interface RawMaterial { id: string; name: string; code: string; unitCost: number }
interface BomDetail {
  id: string;
  productId: string;
  name: string;
  version: string;
  isActive: boolean;
  notes?: string | null;
  components: { rawMaterialId: string; quantity: number; scrapPct: number }[];
}

export function BomPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const canmanage = hasPermission(PERMISSIONS.productionCreate) || hasPermission(PERMISSIONS.productionUpdate);
  const tp = useTableParams();
  const list = useList<BomListRow>("boms", { page: tp.page, pageSize: 20, q: tp.q || undefined });
  const products = useList<Product>("products", { pageSize: 200, sort: "name:asc" });
  const materials = useList<RawMaterial>("raw-materials", { pageSize: 200, sort: "name:asc" });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BomDetail | null>(null);
  const [deleting, setDeleting] = useState<BomListRow | null>(null);

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/boms/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boms"] });
      toast.success("BOM deleted");
      setDeleting(null);
    },
    onError: (err) => toast.error("Could not delete", apiErrorMessage(err)),
  });

  const openEditor = async (row?: BomListRow) => {
    if (row) {
      const detail = (await api.get(`/boms/${row.id}`)).data.data as BomDetail;
      setEditing(detail);
    } else {
      setEditing(null);
    }
    setEditorOpen(true);
  };

  const columns: Column<BomListRow>[] = [
    {
      key: "name",
      header: "BOM",
      sortable: false,
      render: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.name}</div>
          <div className="text-xs text-muted-foreground">
            {r.product.name} · <span className="font-mono">{r.product.sku}</span>
          </div>
        </div>
      ),
    },
    { key: "version", header: "Version", render: (r) => <Badge variant="secondary">{r.version}</Badge> },
    {
      key: "components",
      header: "Components",
      align: "right",
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          {r._count.components}
        </span>
      ),
    },
    { key: "isActive", header: "Status", render: (r) => <ActiveBadge active={r.isActive} /> },
  ];

  // Append an actions column only when the user can manage BOMs.
  const columnsFinal: Column<BomListRow>[] = [
    ...columns,
    ...(canmanage
      ? [
          {
            key: "_actions",
            header: "",
            align: "right" as const,
            render: (r: BomListRow) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => openEditor(r)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleting(r)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Bill of Materials"
        description="Define which raw materials (and how much) each product consumes."
        actions={
          canmanage && (
            <Button onClick={() => openEditor()}>
              <Plus className="h-4 w-4" /> New BOM
            </Button>
          )
        }
      />

      <DataTable
        columns={columnsFinal}
        data={list.data?.data ?? []}
        rowKey={(r) => r.id}
        loading={list.isLoading}
        search={tp.q}
        onSearchChange={tp.setQ}
        searchPlaceholder="Search BOM or product…"
        page={tp.page}
        pageSize={20}
        total={list.data?.meta.total ?? 0}
        onPageChange={tp.setPage}
        emptyTitle="No BOMs yet"
        emptyDescription="Create a bill of materials to enable production planning."
      />

      {editorOpen && (
        <BomEditor
          key={editing?.id ?? "new"}
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          editing={editing}
          products={products.data?.data ?? []}
          materials={materials.data?.data ?? []}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete BOM?"
        description={`This removes "${deleting?.name ?? ""}".`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

function BomEditor({
  open,
  onClose,
  editing,
  products,
  materials,
}: {
  open: boolean;
  onClose: () => void;
  editing: BomDetail | null;
  products: Product[];
  materials: RawMaterial[];
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BomInput>({
    resolver: zodResolver(bomCreateSchema) as Resolver<BomInput>,
    defaultValues: editing
      ? {
          productId: editing.productId,
          name: editing.name,
          version: editing.version,
          isActive: editing.isActive,
          notes: editing.notes ?? "",
          components: editing.components.map((c) => ({
            rawMaterialId: c.rawMaterialId,
            quantity: c.quantity,
            scrapPct: c.scrapPct,
          })),
        }
      : {
          productId: "",
          name: "",
          version: "v1",
          isActive: true,
          notes: "",
          components: [{ rawMaterialId: "", quantity: 1, scrapPct: 0 }],
        },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "components" });
  const rows = watch("components");

  const costOf = (rmId: string) => materials.find((m) => m.id === rmId)?.unitCost ?? 0;
  const estCost = (rows ?? []).reduce(
    (sum, c) => sum + costOf(c.rawMaterialId) * Number(c.quantity || 0) * (1 + Number(c.scrapPct || 0) / 100),
    0,
  );

  const save = useMutation({
    mutationFn: async (values: BomInput) => {
      if (editing) return (await api.patch(`/boms/${editing.id}`, values)).data;
      return (await api.post("/boms", values)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boms"] });
      toast.success(editing ? "BOM updated" : "BOM created");
      onClose();
    },
    onError: (err) => toast.error("Could not save", apiErrorMessage(err)),
  });

  const materialOptions = materials.map((m) => ({ value: m.id, label: `${m.name} (${m.code})` }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? "Edit BOM" : "New BOM"}
      description="Choose the product, then add each raw material and quantity it consumes."
      size="xl"
      footer={
        <>
          <div className="mr-auto text-sm text-muted-foreground">
            Est. material cost:{" "}
            <span className="font-semibold text-foreground">{formatMoney(estCost)}</span>
          </div>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="bom-form" disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create BOM"}
          </Button>
        </>
      }
    >
      <form id="bom-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Product</Label>
            <Select
              {...register("productId")}
              options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
              placeholder="Select product…"
            />
            {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>BOM name</Label>
            <Input {...register("name")} placeholder="Standard BOM" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Version</Label>
            <Input {...register("version")} placeholder="v1" />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Components</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ rawMaterialId: "", quantity: 1, scrapPct: 0 })}
            >
              <Plus className="h-4 w-4" /> Add material
            </Button>
          </div>

          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_120px_110px_40px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
              <span>Material</span>
              <span>Quantity</span>
              <span>Scrap %</span>
              <span />
            </div>
            {fields.map((field, i) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/30 p-2 sm:grid-cols-[1fr_120px_110px_40px] sm:bg-transparent sm:p-0"
              >
                <Select
                  {...register(`components.${i}.rawMaterialId` as const)}
                  options={materialOptions}
                  placeholder="Select material…"
                />
                <Input type="number" step="any" {...register(`components.${i}.quantity` as const)} placeholder="Qty" />
                <Input type="number" step="any" {...register(`components.${i}.scrapPct` as const)} placeholder="0" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {errors.components && (
            <p className={cn("mt-1 text-xs text-destructive")}>
              {errors.components.message ?? "Check the component rows"}
            </p>
          )}
        </div>
      </form>
    </Dialog>
  );
}
