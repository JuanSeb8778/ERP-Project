import { Building2, ShieldCheck, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="Settings" description="Your account, company and effective permissions." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" /> Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Name" value={`${user?.firstName} ${user?.lastName}`} />
            <Row label="Email" value={user?.email} />
            <Row label="Role" value={user?.role.replace(/_/g, " ")} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Company</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Company" value={user?.companyName} />
            <Row label="Tenant ID" value={user?.companyId} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Permissions ({user?.permissions.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {user?.permissions.map((p) => (
                <Badge key={p} variant="secondary" className="font-mono text-[11px]">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
