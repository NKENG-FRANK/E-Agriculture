import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Alert = {
  id: string;
  zone: string;
  type: string;
  message: string;
  level: "critical" | "warning" | "info";
  time: string;
};

const alerts: Alert[] = [];

export const Route = createFileRoute("/dashboard/alerts")({
  head: () => ({ meta: [{ title: "Alerts — SFMS" }] }),
  component: AlertsPage,
});

const config = {
  critical: {
    icon: AlertCircle,
    style: "border-destructive/40 bg-destructive/5",
    iconStyle: "bg-destructive/15 text-destructive",
    badge: "bg-destructive text-destructive-foreground",
  },
  warning: {
    icon: AlertTriangle,
    style: "border-warning/40 bg-warning/5",
    iconStyle: "bg-warning/20 text-warning-foreground",
    badge: "bg-warning text-warning-foreground",
  },
  info: {
    icon: Info,
    style: "border-border bg-card",
    iconStyle: "bg-primary/10 text-primary",
    badge: "bg-primary/15 text-primary",
  },
};

function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
        <p className="text-sm text-muted-foreground">All recent system events across your farm.</p>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
            No alerts available. Connect a real data source to show notifications.
          </div>
        ) : (
          alerts.map((a) => {
            const c = config[a.level];
            const Icon = c.icon;
            return (
              <div
                key={a.id}
                className={cn("flex items-start gap-4 rounded-2xl border p-5 shadow-soft", c.style)}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    c.iconStyle,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-bold">{a.type}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        c.badge,
                      )}
                    >
                      {a.level}
                    </span>
                    <span className="text-xs text-muted-foreground">· {a.zone}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
