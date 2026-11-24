import { useQuery } from "@tanstack/react-query";
import {
  Users, Package, ShoppingCart, AlertTriangle, Factory, Cpu, IndianRupee, Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoStatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { api } from "@/lib/api";
import { formatMoney, formatNumber, cn } from "@/lib/utils";

interface Summary {
  kpis: {
    customers: number; products: number; openOrders: number; lowStock: number;
    productionActive: number; machinesRunning: number; machinesDown: number;
    revenue: number; outstanding: number;
  };
  ordersByStatus: { status: string; count: number }[];
  machinesByStatus: { status: string; count: number }[];
  lowStock: { name: string; warehouseName: string; quantity: number; reorderPoint: number }[];
}

const CHART = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"];

function BarBreakdown({ data }: { data: { status: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (!data.length) return <EmptyState title="No data yet" />;
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.status} className="flex items-center gap-3">
          <div className="w-32 shrink-0 text-sm text-muted-foreground">
            <AutoStatusBadge status={d.status} />
          </div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", CHART[i % CHART.length])} style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <div className="w-8 text-right text-sm font-semibold tabular-nums">{d.count}</div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage({ title = "Reports & Analytics" }: { title?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => (await api.get("/analytics/summary")).data.data as Summary,
  });
  const k = data?.kpis;

  return (
    <div>
      <PageHeader title={title} description="Live KPIs computed from your operational data." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue collected" value={isLoading ? "…" : formatMoney(k?.revenue ?? 0)} icon={IndianRupee} tone="success" />
        <StatCard label="Outstanding" value={isLoading ? "…" : formatMoney(k?.outstanding ?? 0)} icon={Wallet} tone={(k?.outstanding ?? 0) > 0 ? "warning" : "success"} />
        <StatCard label="Open sales orders" value={k?.openOrders ?? "…"} icon={ShoppingCart} />
        <StatCard label="Low-stock items" value={k?.lowStock ?? "…"} icon={AlertTriangle} tone={(k?.lowStock ?? 0) > 0 ? "warning" : "success"} />
        <StatCard label="Active production" value={k?.productionActive ?? "…"} icon={Factory} />
        <StatCard label="Machines running" value={k?.machinesRunning ?? "…"} icon={Cpu} tone="success" hint={`${k?.machinesDown ?? 0} down`} />
        <StatCard label="Customers" value={k?.customers ?? "…"} icon={Users} />
        <StatCard label="Products" value={k?.products ?? "…"} icon={Package} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Sales orders by status</CardTitle></CardHeader>
          <CardContent><BarBreakdown data={data?.ordersByStatus ?? []} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Machines by status</CardTitle></CardHeader>
          <CardContent><BarBreakdown data={data?.machinesByStatus ?? []} /></CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Low-stock watchlist</CardTitle></CardHeader>
        <CardContent>
          {data?.lowStock.length ? (
            <div className="divide-y">
              {data.lowStock.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{r.warehouseName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-warning">{formatNumber(r.quantity)}</span>
                    <span className="text-xs text-muted-foreground"> / {formatNumber(r.reorderPoint)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="All stock healthy" description="Nothing is below its reorder point." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
