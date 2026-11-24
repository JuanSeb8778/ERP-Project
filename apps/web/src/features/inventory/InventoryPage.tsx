import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  ArrowLeftRight,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import {
  stockAdjustSchema,
  stockTransferSchema,
  STOCK_REASON_LABELS,
  type ItemType,
} from "@techforge/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useList, useTableParams } from "@/hooks/useResource";
import { api, apiErrorMessage } from "@/lib/api";
import { formatNumber, formatDateTime, cn } from "@/lib/utils";
import { PERMISSIONS } from "@techforge/shared";

interface StockRow {
  id: string;
  warehouseId: string;
  warehouseName: string;
  itemType: ItemType;
  itemId: string;
  name: string;
  code: string;
  unit: string;
  quantity: number;
  reorderPoint: number;
  isLow: boolean;
  updatedAt: string;
}
interface Movement {
  id: string;
  createdAt: string;
  warehouseName: string;
  itemType: ItemType;
  name: string;
  delta: number;
  balanceAfter: number;
  reason: keyof typeof STOCK_REASON_LABELS;
  note?: string | null;
}
interface Warehouse { id: string; name: string; code: string }
interface Item { id: string; name: string }

export function InventoryPage() {
  const { hasPermission } = useAuth();
  const canAdjust = hasPermission(PERMISSIONS.inventoryUpdate);
  const [tab, setTab] = useState<"stock" | "ledger">("stock");
  const [warehouseId, setWarehouseId] = useState("");
  const [itemType, setItemType] = useState<"" | ItemType>("");
  const [lowOnly, setLowOnly] = useState(false);
  const tp = useTableParams();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const warehouses = useList<Warehouse>("warehouses", { pageSize: 100, sort: "name:asc" });
  const stock = useList<StockRow>("inventory", {
    page: tp.page,
    pageSize: 20,
    q: tp.q || undefined,
    warehouseId: warehouseId || undefined,
    itemType: itemType || undefined,
    lowOnly: lowOnly || undefined,
  });
  const lowStock = useQuery({
    queryKey: ["inventory", "low"],
    queryFn: async () => (await api.get("/inventory/low-stock")).data.data as StockRow[],
  });

  const columns: Column<StockRow>[] = [
    { key: "code", header: "Item code", className: "font-mono text-xs text-muted-foreground" },
    {
      key: "name",
      header: "Item",
      render: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.name}</div>
          <Badge variant="secondary" className="mt-0.5">
            {r.itemType === "PRODUCT" ? "Product" : "Raw material"}
          </Badge>
        </div>
      ),
    },
    { key: "warehouseName", header: "Warehouse" },
    {
      key: "quantity",
      header: "On hand",
      align: "right",
      render: (r) => (
        <span className="font-semibold tabular-nums">
          {formatNumber(r.quantity)} <span className="text-xs font-normal text-muted-foreground">{r.unit}</span>
        </span>
      ),
    },
    { key: "reorderPoint", header: "Reorder", align: "right", render: (r) => formatNumber(r.reorderPoint) },
    {
      key: "isLow",
      header: "Status",
      render: (r) =>
        r.isLow ? (
          <StatusBadge label="Low" variant="warning" />
        ) : (
          <StatusBadge label="OK" variant="success" />
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Live stock levels across warehouses, with a full movement ledger."
        actions={
          canAdjust && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="h-4 w-4" />
                Transfer
              </Button>
              <Button onClick={() => setAdjustOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                Adjust stock
              </Button>
            </div>
          )
        }
      />

      <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard label="Stock records" value={stock.data?.meta.total ?? "…"} icon={Boxes} />
        <StatCard
          label="Low-stock items"
          value={lowStock.data?.length ?? "…"}
          icon={AlertTriangle}
          tone={(lowStock.data?.length ?? 0) > 0 ? "warning" : "success"}
          hint="At or below reorder point"
        />
        <StatCard label="Warehouses" value={warehouses.data?.meta.total ?? "…"} icon={WarehouseIcon} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b">
        {(["stock", "ledger"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "stock" ? "Stock levels" : "Movement ledger"}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <DataTable
          columns={columns}
          data={stock.data?.data ?? []}
          rowKey={(r) => r.id}
          loading={stock.isLoading}
          search={tp.q}
          onSearchChange={tp.setQ}
          searchPlaceholder="Search item name or code…"
          page={tp.page}
          pageSize={20}
          total={stock.data?.meta.total ?? 0}
          onPageChange={tp.setPage}
          emptyTitle="No stock records"
          emptyDescription="Adjust stock or receive a purchase to populate inventory."
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder="All warehouses"
                options={(warehouses.data?.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
                className="h-9 w-auto"
              />
              <Select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ItemType | "")}
                placeholder="All types"
                options={[
                  { value: "PRODUCT", label: "Products" },
                  { value: "RAW_MATERIAL", label: "Raw materials" },
                ]}
                className="h-9 w-auto"
              />
              <Button
                variant={lowOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setLowOnly((v) => !v)}
              >
                <AlertTriangle className="h-4 w-4" />
                Low only
              </Button>
            </div>
          }
        />
      ) : (
        <MovementLedger />
      )}

      {adjustOpen && (
        <AdjustDialog
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          warehouses={warehouses.data?.data ?? []}
        />
      )}
      {transferOpen && (
        <TransferDialog
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          warehouses={warehouses.data?.data ?? []}
        />
      )}
    </div>
  );
}

function MovementLedger() {
  const [page, setPage] = useState(1);
  const movements = useList<Movement>("inventory/movements", { page, pageSize: 20 });
  const columns: Column<Movement>[] = [
    { key: "createdAt", header: "When", render: (r) => formatDateTime(r.createdAt) },
    { key: "name", header: "Item", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "warehouseName", header: "Warehouse" },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <Badge variant="secondary">{STOCK_REASON_LABELS[r.reason] ?? r.reason}</Badge>,
    },
    {
      key: "delta",
      header: "Change",
      align: "right",
      render: (r) => (
        <span className={cn("font-semibold tabular-nums", r.delta >= 0 ? "text-success" : "text-destructive")}>
          {r.delta >= 0 ? "+" : ""}
          {formatNumber(r.delta)}
        </span>
      ),
    },
    { key: "balanceAfter", header: "Balance", align: "right", render: (r) => formatNumber(r.balanceAfter) },
  ];
  return (
    <DataTable
      columns={columns}
      data={movements.data?.data ?? []}
      rowKey={(r) => r.id}
      loading={movements.isLoading}
      page={page}
      pageSize={20}
      total={movements.data?.meta.total ?? 0}
      onPageChange={setPage}
      emptyTitle="No movements yet"
      emptyDescription="Stock adjustments and transfers will appear here."
    />
  );
}

/** Shared item picker: choose type, then item. */
function useItemOptions(itemType: ItemType | "") {
  const products = useList<Item>("products", { pageSize: 200, sort: "name:asc" });
  const raws = useList<Item>("raw-materials", { pageSize: 200, sort: "name:asc" });
  return useMemo(() => {
    const src = itemType === "PRODUCT" ? products.data?.data : itemType === "RAW_MATERIAL" ? raws.data?.data : [];
    return (src ?? []).map((i) => ({ value: i.id, label: i.name }));
  }, [itemType, products.data, raws.data]);
}

function AdjustDialog({
  open,
  onClose,
  warehouses,
}: {
  open: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [itemType, setItemType] = useState<ItemType | "">("");
  const [itemId, setItemId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("ADJUSTMENT");
  const [note, setNote] = useState("");
  const itemOptions = useItemOptions(itemType);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = stockAdjustSchema.parse({ warehouseId, itemType, itemId, delta, reason, note });
      return (await api.post("/inventory/adjust", parsed)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock adjusted");
      onClose();
    },
    onError: (err) => toast.error("Could not adjust", apiErrorMessage(err)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Adjust stock"
      description="Apply a signed change to one item in a warehouse. Positive adds, negative removes."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Warehouse</Label>
          <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))} placeholder="Select…" />
        </div>
        <div className="space-y-1.5">
          <Label>Item type</Label>
          <Select value={itemType} onChange={(e) => { setItemType(e.target.value as ItemType); setItemId(""); }}
            placeholder="Select…"
            options={[{ value: "PRODUCT", label: "Product" }, { value: "RAW_MATERIAL", label: "Raw material" }]} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Item</Label>
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)} options={itemOptions}
            placeholder={itemType ? "Select item…" : "Pick a type first"} disabled={!itemType} />
        </div>
        <div className="space-y-1.5">
          <Label>Change (+/-)</Label>
          <Input type="number" step="any" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 50 or -10" />
        </div>
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}
            options={Object.entries(STOCK_REASON_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Note</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional context" />
        </div>
      </div>
    </Dialog>
  );
}

function TransferDialog({
  open,
  onClose,
  warehouses,
}: {
  open: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const [fromWarehouseId, setFrom] = useState(warehouses[0]?.id ?? "");
  const [toWarehouseId, setTo] = useState(warehouses[1]?.id ?? "");
  const [itemType, setItemType] = useState<ItemType | "">("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const itemOptions = useItemOptions(itemType);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = stockTransferSchema.parse({ fromWarehouseId, toWarehouseId, itemType, itemId, quantity, note });
      return (await api.post("/inventory/transfer", parsed)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock transferred");
      onClose();
    },
    onError: (err) => toast.error("Could not transfer", apiErrorMessage(err)),
  });

  const whOptions = warehouses.map((w) => ({ value: w.id, label: w.name }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Transfer stock"
      description="Move quantity of an item from one warehouse to another."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Transfer
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>From</Label>
          <Select value={fromWarehouseId} onChange={(e) => setFrom(e.target.value)} options={whOptions} />
        </div>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Select value={toWarehouseId} onChange={(e) => setTo(e.target.value)} options={whOptions} />
        </div>
        <div className="space-y-1.5">
          <Label>Item type</Label>
          <Select value={itemType} onChange={(e) => { setItemType(e.target.value as ItemType); setItemId(""); }}
            placeholder="Select…"
            options={[{ value: "PRODUCT", label: "Product" }, { value: "RAW_MATERIAL", label: "Raw material" }]} />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity</Label>
          <Input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 25" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Item</Label>
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)} options={itemOptions}
            placeholder={itemType ? "Select item…" : "Pick a type first"} disabled={!itemType} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Note</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional context" />
        </div>
      </div>
    </Dialog>
  );
}
