import { Construction } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Card, CardContent } from "@/components/ui/card";

/** Temporary page for modules that ship in later phases. Keeps navigation whole. */
export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} description="This module is part of the phased roadmap." />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Construction className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">Coming in {phase}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            The foundation (auth, RBAC, multi-tenancy) is live. This feature is scheduled in the
            development roadmap and will appear here once its phase is built.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
