import { Bell, Menu, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function DashboardTopbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
      <button
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden flex-1 md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search zones, sensors..."
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Link
          to="/dashboard/alerts"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight">Alex Farmer</p>
            <p className="text-xs text-muted-foreground">Owner</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero font-semibold text-primary-foreground">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
