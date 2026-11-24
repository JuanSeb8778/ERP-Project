import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "destructive" | "info";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: Tone;
  trend?: { value: string; direction: "up" | "down"; good?: boolean };
}) {
  const toneClass: Record<Tone, string> = {
    default: "bg-primary/10 text-primary ring-primary/15",
    success: "bg-success/12 text-success ring-success/15",
    warning: "bg-warning/15 text-warning ring-warning/20",
    destructive: "bg-destructive/10 text-destructive ring-destructive/15",
    info: "bg-info/12 text-info ring-info/15",
  };

  const trendGood = trend?.good ?? trend?.direction === "up";

  return (
    <Card interactive className="h-full overflow-hidden">
      <div className="flex h-full items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {(trend || hint) && (
            <div className="mt-1.5 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold",
                    trendGood ? "text-success" : "text-destructive",
                  )}
                >
                  {trend.direction === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {trend.value}
                </span>
              )}
              {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
            </div>
          )}
        </div>
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset",
            toneClass[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
