import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Thermometer, Wind, ArrowRight, Sprout, Bird, Fish, Users } from "lucide-react";
import { cn } from "../lib/utils";

type ZoneCategory = "crop" | "livestock" | "poultry" | "aquaculture";

type Zone = {
  id: string;
  name: string;
  crop: string;
  area: string;
  category: ZoneCategory;
  moisture: number;
  temperature: number;
  humidity: number;
  status: "good" | "warning" | "critical";
  population?: number;
  oxygen?: number;
  phLevel?: number;
};

const zones: Zone[] = [];

export const Route = createFileRoute("/dashboard/zones")({
  head: () => ({ meta: [{ title: "Farm Zones — SFMS" }] }),
  component: ZonesPage,
});

const statusStyle = {
  good: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  critical: "bg-destructive/15 text-destructive",
};

const categoryMeta: Record<ZoneCategory, { label: string; Icon: typeof Sprout; tint: string }> = {
  crop: { label: "Crops", Icon: Sprout, tint: "bg-success/10 text-success" },
  livestock: { label: "Livestock", Icon: Users, tint: "bg-warning/15 text-warning-foreground" },
  poultry: { label: "Poultry", Icon: Bird, tint: "bg-accent/20 text-accent-foreground" },
  aquaculture: { label: "Aquaculture", Icon: Fish, tint: "bg-primary/10 text-primary" },
};

function ZonesPage() {
  const groups: ZoneCategory[] = ["crop", "poultry", "aquaculture"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Farm Zones</h1>
        <p className="text-sm text-muted-foreground">
          Crops, poultry, and aquaculture — monitored side by side.
        </p>
      </div>

      {zones.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Zone data unavailable. Connect your backend source to display farm zones.
        </div>
      ) : (
        groups.map((cat) => {
          const list = zones.filter((z) => z.category === cat);
          if (!list.length) return null;
          const meta = categoryMeta[cat];
          const CatIcon = meta.Icon;
          return (
            <section key={cat} className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg", meta.tint)}
                >
                  <CatIcon className="h-4 w-4" />
                </span>
                <h2 className="font-display text-xl font-bold">{meta.label}</h2>
                <span className="text-xs text-muted-foreground">({list.length})</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((z) => (
                  <Link
                    key={z.id}
                    to="/dashboard/zones/$zoneId"
                    params={{ zoneId: z.id }}
                    className="group rounded-2xl border border-border bg-gradient-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/50"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg font-bold">{z.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {z.crop} · {z.area}
                          {z.population ? ` · ${z.population} head` : ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                          statusStyle[z.status],
                        )}
                      >
                        {z.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {cat === "aquaculture" ? (
                        <>
                          <Stat icon={Droplets} value={`${z.oxygen ?? "-"}`} label="O₂ mg/L" />
                          <Stat icon={Thermometer} value={`${z.temperature}°C`} label="Water" />
                          <Stat icon={Wind} value={`${z.phLevel ?? "-"}`} label="pH" />
                        </>
                      ) : (
                        <>
                          <Stat icon={Droplets} value={`${z.moisture}%`} label="Moisture" />
                          <Stat icon={Thermometer} value={`${z.temperature}°C`} label="Temp" />
                          <Stat icon={Wind} value={`${z.humidity}%`} label="Humidity" />
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex items-center text-sm font-semibold text-primary">
                      View details{" "}
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Droplets;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <Icon className="mb-1 h-4 w-4 text-primary" />
      <p className="font-display text-base font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
