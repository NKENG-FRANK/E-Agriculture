import { Link, useLocation, useSearch, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Map,
  Sprout,
  Bird,
  Fish,
  BarChart3,
  Sliders,
  Bell,
  Settings,
  LogOut,
  MessageSquare,
  LandPlot,
  ChevronRight,
  Waves,
  Zap,
  Menu,
  X,
  AlertCircle
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "../lib/utils";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/admin?tab=requests", label: "Pending Requests", icon: MessageSquare },
  { to: "/dashboard/admin?tab=farms", label: "Farm Management", icon: LandPlot },
  { to: "/dashboard/admin?tab=owners", label: "Owner Management", icon: Users },
  { to: "/dashboard/crops", label: "Crops", icon: Sprout },
  { to: "/dashboard/poultry", label: "Poultry", icon: Bird },
  { to: "/dashboard/aquaculture", label: "Aquaculture", icon: Fish },
  { to: "/dashboard/zones", label: "All Zones", icon: Map },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/control", label: "Control Panel", icon: Sliders },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/settings", label: "Team Management", icon: Users },
] as const;

export function DashboardSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();
  const search = useSearch({ from: "/dashboard" }) as { role?: string };

  // Mock role check - in a real app, this would come from an auth hook/context
  const userRole: "admin" | "owner" | "sub-user" = pathname.includes("/admin") 
    ? "admin" 
    : search.role === "sub-user"
      ? "sub-user" 
      : "owner";

  // Mock assigned sections for sub-user
  const assignedSections = ["/dashboard/crops", "/dashboard/poultry"];

  const filteredNavItems = navItems.filter(item => {
    // Admin role only sees the 3 specific admin options
    if (userRole === "admin") {
      return [
        "/dashboard/admin?tab=requests",
        "/dashboard/admin?tab=farms",
        "/dashboard/admin?tab=owners"
      ].includes(item.to);
    }
    
    // Non-admin users never see the admin options
    if ([
      "/dashboard/admin?tab=requests",
      "/dashboard/admin?tab=farms",
      "/dashboard/admin?tab=owners"
    ].includes(item.to)) {
      return false;
    }
    
    // Team management only for owners (and admins, though admins won't reach here)
    if (item.to === "/dashboard/settings") return userRole !== "sub-user";

    // Sub-users only see their assigned sections
    if (userRole === "sub-user") {
      const sectionRoutes = ["/dashboard/crops", "/dashboard/poultry", "/dashboard/aquaculture"];
      if (sectionRoutes.includes(item.to)) {
        return assignedSections.includes(item.to);
      }
    }

    return true;
  });

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
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            
            // Extract base path if item.to has search params
            const [basePath] = item.to.split("?");
            
            return (
              <Link
                key={item.to}
                to={basePath as any}
                search={((prev: any) => ({ 
                  ...prev, 
                  role: userRole,
                  // Keep tab if it exists in the original item.to
                  tab: item.to.includes("tab=") ? item.to.split("tab=")[1] : prev.tab 
                })) as any}
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
