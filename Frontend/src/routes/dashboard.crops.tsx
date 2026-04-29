import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, Droplets, Thermometer, Wind, ArrowRight } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

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

type SensorReading = {
  time: string;
  moisture: number;
  temperature: number;
  humidity: number;
  oxygen: number;
};

const zones: Zone[] = [];

export const Route = createFileRoute("/dashboard/crops")({
  head: () => ({
    meta: [
      { title: "Crops Dashboard — SFMS" },
      {
        name: "description",
        content: "Monitor soil moisture, temperature and humidity across all crop zones.",
      },
    ],
  }),
  component: CropsDashboard,
});

const statusStyle = {
  good: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  critical: "bg-destructive/15 text-destructive",
};

function CropsDashboard() {
  const list = zones.filter((z) => z.category === "crop");
  const history: SensorReading[] = [];
  const avgMoisture = list.length
    ? Math.round(list.reduce((s, z) => s + z.moisture, 0) / list.length)
    : 0;
  const avgTemp = list.length
    ? (list.reduce((s, z) => s + z.temperature, 0) / list.length).toFixed(1)
    : "-";
  const avgHum = list.length
    ? Math.round(list.reduce((s, z) => s + z.humidity, 0) / list.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <Sprout className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Crops Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {list.length} crop zones · soil & climate monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Droplets} label="Avg Soil Moisture" value={`${avgMoisture}%`} />
        <Stat icon={Thermometer} label="Avg Temperature" value={`${avgTemp}°C`} />
        <Stat icon={Wind} label="Avg Humidity" value={`${avgHum}%`} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-bold">Soil moisture trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="cm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.15 145)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.55 0.15 145)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.015 140)" />
            <XAxis dataKey="time" stroke="oklch(0.50 0.02 150)" fontSize={11} />
            <YAxis stroke="oklch(0.50 0.02 150)" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "oklch(1 0 0)",
                border: "1px solid oklch(0.91 0.015 140)",
                borderRadius: 8,
              }}
            />
            <Area
              type="monotone"
              dataKey="moisture"
              stroke="oklch(0.55 0.15 145)"
              strokeWidth={2.5}
              fill="url(#cm)"
            />
          </AreaChart>
        </ResponsiveContainer>
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
              <MiniStat icon={Droplets} value={`${z.moisture}%`} label="Moisture" />
              <MiniStat icon={Thermometer} value={`${z.temperature}°C`} label="Temp" />
              <MiniStat icon={Wind} value={`${z.humidity}%`} label="Humidity" />
            </div>
            <div className="mt-4 flex items-center text-sm font-semibold text-primary">
              View details{" "}
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Droplets;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function MiniStat({
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
