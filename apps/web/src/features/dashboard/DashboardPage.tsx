import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee, Wallet, ShoppingCart, AlertTriangle, Factory, Cpu, ShieldCheck, KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { NAV } from "@/config/nav";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

interface Summary {
  kpis: {
    customers: number; products: number; openOrders: number; lowStock: number;
    productionActive: number; machinesRunning: number; machinesDown: number;
    revenue: number; outstanding: number;
  };
}

export function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => (await api.get("/analytics/summary")).data.data as Summary,
  });
  const k = data?.kpis;

  const accessibleModules = NAV.flatMap((g) => g.items).filter(
    (i) => !i.permission || hasPermission(i.permission),
  );

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`}
        description="Your live operational overview — orders, cash, production and inventory at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue collected" value={isLoading ? "…" : formatMoney(k?.revenue ?? 0)} icon={IndianRupee} tone="success" />
        <StatCard label="Outstanding" value={isLoading ? "…" : formatMoney(k?.outstanding ?? 0)} icon={Wallet} tone={(k?.outstanding ?? 0) > 0 ? "warning" : "success"} hint="Awaiting payment" />
        <StatCard label="Open sales orders" value={k?.openOrders ?? "…"} icon={ShoppingCart} hint="Confirmed / in production" />
        <StatCard label="Low-stock items" value={k?.lowStock ?? "…"} icon={AlertTriangle} tone={(k?.lowStock ?? 0) > 0 ? "warning" : "success"} hint="At or below reorder point" />
        <StatCard label="Active production" value={k?.productionActive ?? "…"} icon={Factory} hint="Released / in progress" />
        <StatCard label="Machines running" value={k?.machinesRunning ?? "…"} icon={Cpu} tone="success" hint={`${k?.machinesDown ?? 0} down`} />
        <StatCard label="Customers" value={k?.customers ?? "…"} icon={ShoppingCart} />
        <StatCard label="Products" value={k?.products ?? "…"} icon={Factory} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              The sidebar and every endpoint are filtered by your permission set. This is what your
              role (<span className="font-medium text-foreground">{user?.role.replace(/_/g, " ")}</span>) can reach:
            </p>
            <div className="flex flex-wrap gap-2">
              {accessibleModules.map((m) => (
                <Badge key={m.to} variant="secondary" className="gap-1.5">
                  <m.icon className="h-3 w-3" />
                  {m.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security posture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={ShieldCheck} label="Role" value={user?.role.replace(/_/g, " ") ?? "-"} />
            <Row icon={KeyRound} label="Permissions" value={String(user?.permissions.length ?? 0)} />
            <Row icon={ShoppingCart} label="Modules unlocked" value={String(accessibleModules.length)} />
            <p className="pt-1 text-xs text-muted-foreground">
              Enforced server-side on every API call, scoped to your company.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-medium capitalize">{value.toLowerCase()}</span>
    </div>
  );
}
