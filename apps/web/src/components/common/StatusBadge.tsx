import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Variant = React.ComponentProps<typeof Badge>["variant"];

/** Small colored dot + label, used for record status across the app. */
export function StatusBadge({
  label,
  variant = "secondary",
  dot = true,
}: {
  label: string;
  variant?: Variant;
  dot?: boolean;
}) {
  const dotColor: Record<string, string> = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    info: "bg-info",
    secondary: "bg-muted-foreground",
    outline: "bg-muted-foreground",
  };
  return (
    <Badge variant={variant} className="capitalize">
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[variant ?? "secondary"])} />}
      {label}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <StatusBadge label={active ? "Active" : "Inactive"} variant={active ? "success" : "secondary"} />;
}

import { STATUS_TONE } from "@techforge/shared";

/** Colours a workflow status string via the shared STATUS_TONE map. */
export function AutoStatusBadge({ status }: { status: string }) {
  const variant = (STATUS_TONE[status] ?? "secondary") as Variant;
  return <StatusBadge label={status.replace(/_/g, " ").toLowerCase()} variant={variant} />;
}
