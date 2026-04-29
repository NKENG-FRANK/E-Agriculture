import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Sprout,
  Bird,
  Fish,
  BarChart3,
  Sliders,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/crops", label: "Crops", icon: Sprout },
  { to: "/dashboard/poultry", label: "Poultry", icon: Bird },
  { to: "/dashboard/aquaculture", label: "Aquaculture", icon: Fish },
  { to: "/dashboard/zones", label: "All Zones", icon: Map },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/control", label: "Control Panel", icon: Sliders },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <Link
            to="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}
