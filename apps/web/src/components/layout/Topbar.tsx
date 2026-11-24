import { LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsMenu } from "./NotificationsMenu";
import { useAuth } from "@/providers/AuthProvider";
import { initials } from "@/lib/utils";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search orders, products, machines…"
          className="border-transparent bg-muted/60 pl-9 focus-visible:bg-card"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none rounded border bg-card px-1.5 font-mono text-[10px] text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsMenu />

        {user && (
          <div className="ml-1 flex items-center gap-2 border-l border-border/70 pl-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-sidebar-accent text-xs font-semibold text-primary-foreground shadow-sm">
              {initials(user.firstName, user.lastName)}
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[11px] text-muted-foreground">{user.companyName}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
