import { NavLink } from "react-router-dom";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/config/nav";
import { useAuth } from "@/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, hasPermission } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col bg-gradient-to-b from-sidebar to-sidebar-to text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-sidebar-accent text-primary-foreground shadow-lg shadow-primary/30">
          <Boxes className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">TechForge</div>
          <div className="text-[11px] tracking-wide text-sidebar-foreground/60">ERP + MES</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const items = group.items.filter((i) => !i.permission || hasPermission(i.permission));
          if (!items.length) return null;
          return (
            <div key={group.title}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-sidebar-foreground/75 hover:bg-white/[0.06] hover:text-white",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-accent transition-opacity",
                              isActive ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive ? "text-sidebar-accent" : "text-sidebar-foreground/60 group-hover:text-white",
                            )}
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.ready === false && (
                            <Badge
                              variant="secondary"
                              className="h-4 border-0 bg-white/10 px-1.5 text-[9px] text-sidebar-foreground/70"
                            >
                              soon
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-sidebar-foreground/60">
        Signed in as <span className="font-medium text-white">{user?.role.replace(/_/g, " ")}</span>
      </div>
    </aside>
  );
}
