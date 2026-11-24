import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { api } from "@/lib/api";
import { PERMISSIONS } from "@techforge/shared";
import { cn } from "@/lib/utils";

interface LowItem { name: string; warehouseName: string; quantity: number; reorderPoint: number }

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canSeeInventory = hasPermission(PERMISSIONS.inventoryRead);

  const { data: low = [] } = useQuery({
    queryKey: ["notifications", "low-stock"],
    enabled: canSeeInventory,
    queryFn: async () => (await api.get("/inventory/low-stock")).data.data as LowItem[],
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const count = low.length;

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setOpen((o) => !o)} className="relative">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-[3px] text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl animate-in">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {count > 0 && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                {count} low-stock
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="text-sm font-medium">You're all caught up</p>
                <p className="text-xs text-muted-foreground">No low-stock alerts right now.</p>
              </div>
            ) : (
              low.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setOpen(false);
                    navigate("/inventory");
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    i < low.length - 1 && "border-b",
                  )}
                >
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.warehouseName} · {item.quantity} on hand (reorder at {item.reorderPoint})
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {canSeeInventory && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/inventory");
              }}
              className="w-full border-t px-4 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-muted/50"
            >
              View inventory
            </button>
          )}
        </div>
      )}
    </div>
  );
}
