import { createFileRoute, Link } from "@tanstack/react-router";
import { Fish, Droplets, Thermometer, Waves, ArrowRight, FlaskConical } from "lucide-react";
import {
  LineChart,
  Line,
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

export const Route = createFileRoute("/dashboard/aquaculture")({
  head: () => ({
    meta: [
      { title: "Aquaculture Dashboard — SFMS" },
      {
        name: "description",
        content: "Monitor water temperature, oxygen and pH across fish ponds.",
      },
    ],
  }),
  component: AquacultureDashboard,
});

const statusStyle = {
  good: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  critical: "bg-destructive/15 text-destructive",
};

function AquacultureDashboard() {
  const list = zones.filter((z) => z.category === "aquaculture");
  const history: SensorReading[] = [];
  const totalFish = list.reduce((s, z) => s + (z.population ?? 0), 0);
  const avgTemp = list.length
    ? (list.reduce((s, z) => s + z.temperature, 0) / list.length).toFixed(1)
    : "-";
  const avgO2 = list.length
    ? (list.reduce((s, z) => s + (z.oxygen ?? 0), 0) / list.length).toFixed(1)
    : "-";
  const avgPh = list.length
    ? (list.reduce((s, z) => s + (z.phLevel ?? 0), 0) / list.length).toFixed(1)
    : "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Fish className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Aquaculture Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} fish ponds · {totalFish} fish stocked
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Fish} label="Total Stock" value={`${totalFish}`} />
        <Stat icon={Waves} label="Avg Oxygen" value={`${avgO2} mg/L`} />
        <Stat icon={Thermometer} label="Avg Water Temp" value={`${avgTemp}°C`} />
        <Stat icon={FlaskConical} label="Avg pH Level" value={`${avgPh}`} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-bold">Water quality trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={history}>
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
            <Line
              type="monotone"
              dataKey="oxygen"
              stroke="oklch(0.65 0.15 220)"
              strokeWidth={2.5}
              dot={false}
              name="O₂ mg/L"
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="oklch(0.78 0.16 75)"
              strokeWidth={2.5}
              dot={false}
              name="Temp °C"
            />
          </LineChart>
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
                  {z.crop} · {z.population} fish
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
              <MiniStat icon={Waves} value={`${z.oxygen}`} label="O₂ mg/L" />
              <MiniStat icon={Thermometer} value={`${z.temperature}°C`} label="Water" />
              <MiniStat icon={FlaskConical} value={`${z.phLevel}`} label="pH" />
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

function Stat({ icon: Icon, label, value }: { icon: typeof Fish; label: string; value: string }) {
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
  icon: typeof Fish;
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
