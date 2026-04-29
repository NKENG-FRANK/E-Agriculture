import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Droplets, Thermometer, Wind } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

export const Route = createFileRoute("/dashboard/zones/$zoneId")({
  head: () => ({ meta: [{ title: "Zone detail — SFMS" }] }),
  component: ZoneDetail,
  notFoundComponent: () => <div className="p-8">Zone not found.</div>,
});

function ZoneDetail() {
  const { zoneId } = Route.useParams();
  const zone = zones.find((z) => z.id === zoneId);
  const history: SensorReading[] = [];

  if (!zone) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p>Zone not found.</p>
        <Link to="/dashboard/zones" className="mt-4 inline-block text-primary hover:underline">
          Back to zones
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/zones"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to zones
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{zone.name}</h1>
          <p className="text-sm text-muted-foreground">
            {zone.crop} · {zone.area}
          </p>
        </div>
        <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold uppercase text-success">
          {zone.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Droplets, label: "Soil Moisture", value: `${zone.moisture}%` },
          { icon: Thermometer, label: "Temperature", value: `${zone.temperature}°C` },
          { icon: Wind, label: "Humidity", value: `${zone.humidity}%` },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft"
            >
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-bold">24h sensor history</h3>
        <ResponsiveContainer width="100%" height={320}>
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
              dataKey="moisture"
              stroke="oklch(0.55 0.15 145)"
              strokeWidth={2.5}
              dot={false}
              name="Moisture"
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="oklch(0.78 0.16 75)"
              strokeWidth={2.5}
              dot={false}
              name="Temp"
            />
            <Line
              type="monotone"
              dataKey="humidity"
              stroke="oklch(0.72 0.17 142)"
              strokeWidth={2.5}
              dot={false}
              name="Humidity"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
