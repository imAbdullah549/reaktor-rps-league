import { Outlet, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Recent matches" },
  { to: "/matches", label: "Matches" },
  { to: "/leaderboard/today", label: "Today's standings" },
  { to: "/leaderboard/historical", label: "Past standings" },
] as const;

export function Layout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3 sm:px-6 flex flex-row items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold tracking-tight text-foreground shrink-0">
          RPS League
        </h1>
        <nav className="flex flex-wrap gap-1 sm:gap-2 items-center" aria-label="Main navigation">
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {({ isActive }) => (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(isActive && "bg-accent text-accent-foreground")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{label}</span>
                </Button>
              )}
            </NavLink>
          ))}
        </nav>
      </header>
      <main
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
        style={{
          backgroundColor: "color-mix(in oklab, var(--muted) 20%, transparent)",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
