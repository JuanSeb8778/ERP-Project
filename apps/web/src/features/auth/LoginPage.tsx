import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Boxes, Loader2, Factory, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthProvider";
import { apiErrorMessage } from "@/lib/api";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@techforge.dev" },
  { label: "Production Mgr", email: "pm@techforge.dev" },
  { label: "Operator", email: "operator@techforge.dev" },
  { label: "Quality", email: "qc@techforge.dev" },
  { label: "Sales", email: "sales@techforge.dev" },
  { label: "Finance", email: "finance@techforge.dev" },
];
const DEMO_PASSWORD = "Password123!";

const HIGHLIGHTS = [
  { icon: Factory, title: "Shop-floor to boardroom", text: "Orders, production, machines & OEE in one workspace." },
  { icon: ShieldCheck, title: "Role-aware by design", text: "Every route and record scoped to permissions & tenant." },
  { icon: LineChart, title: "Grounded AI insights", text: "Ask your data — answers come from live records, not guesses." },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/";

  const [email, setEmail] = useState("admin@techforge.dev");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-sidebar via-sidebar to-sidebar-to p-12 text-sidebar-foreground lg:flex">
        {/* Decorative glow + grid */}
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-chart-4/20 blur-3xl" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-sidebar-accent text-primary-foreground shadow-lg shadow-primary/30">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="text-lg font-semibold text-white">TechForge ERP</div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-[2rem] font-semibold leading-[1.15] text-white">
            The AI-powered ERP&nbsp;+&nbsp;MES for modern manufacturing.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-foreground/70">
            From customer inquiry to dispatch — orders, production, machines, quality, inventory and
            analytics in one fast, role-aware workspace.
          </p>

          <div className="mt-10 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-sidebar-accent ring-1 ring-inset ring-white/10">
                  <h.icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{h.title}</div>
                  <div className="text-xs text-sidebar-foreground/60">{h.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} TechForge Manufacturing Pvt. Ltd.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-in">
          {/* Small brand for mobile */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-sidebar-accent text-primary-foreground shadow-md">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="text-lg font-semibold">TechForge ERP</div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back. Enter your credentials.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="mt-8">
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground">
                Demo accounts · {DEMO_PASSWORD}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                  className="rounded-md border bg-card px-2 py-1.5 text-xs font-medium shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-sm"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
