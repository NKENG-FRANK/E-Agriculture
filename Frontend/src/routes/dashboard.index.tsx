import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Thermometer, Wind, Waves, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type SensorReading = {
  time: string;
  moisture: number;
  temperature: number;
  humidity: number;
  oxygen: number;
};

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — SFMS" }] }),
  component: DashboardOverview,
});

type Status = "good" | "warning" | "critical";
const statusFor = (key: "moisture" | "temperature" | "humidity" | "oxygen", v: number): Status => {
  if (key === "moisture") return v < 35 ? "critical" : v < 50 ? "warning" : "good";
  if (key === "temperature") return v > 32 ? "critical" : v > 28 ? "warning" : "good";
  if (key === "humidity") return v < 45 ? "warning" : "good";
  return v < 6 ? "warning" : "good";
};

const statusStyle: Record<Status, string> = {
  good: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  critical: "bg-destructive/15 text-destructive",
};

function DashboardOverview() {
  const { data: readings = [], isLoading, refetch } = useQuery({
    queryKey: ["readings"],
    queryFn: () => api.analytics.getReadings(20),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const history: SensorReading[] = readings.map((r: any) => ({
    time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    moisture: r.soil_moisture,
    temperature: r.temperature,
    humidity: r.humidity,
    oxygen: 7.2, // Mocked as it's not in the main sensor payload yet
  }));

  const latest: SensorReading = history[history.length - 1] ?? {
    time: "-",
    moisture: 0,
    temperature: 0,
    humidity: 0,
    oxygen: 0,
  };

  const prev: SensorReading = history[history.length - 2] ?? latest;

  const cards = [
    {
      key: "moisture" as const,
      label: "Soil Moisture",
      value: `${latest.moisture}%`,
      icon: Droplets,
      raw: latest.moisture,
      prev: prev.moisture,
    },
    {
      key: "temperature" as const,
      label: "Temperature",
      value: `${latest.temperature}°C`,
      icon: Thermometer,
      raw: latest.temperature,
      prev: prev.temperature,
    },
    {
      key: "humidity" as const,
      label: "Humidity",
      value: `${latest.humidity}%`,
      icon: Wind,
      raw: latest.humidity,
      prev: prev.humidity,
    },
    {
      key: "oxygen" as const,
      label: "Water Oxygen",
      value: `${latest.oxygen} mg/L`,
      icon: Waves,
      raw: latest.oxygen,
      prev: prev.oxygen,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Farm Overview</h1>
          <p className="text-sm text-muted-foreground">
            Live sensor data updated every 10 seconds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Live
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const status = statusFor(c.key, c.raw);
          const trend = c.raw - c.prev;
          return (
            <div
              key={c.key}
              className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    statusStyle[status],
                  )}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="font-display text-3xl font-bold">{c.value}</p>
                <span
                  className={cn(
                    "flex items-center text-xs font-semibold",
                    trend >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend).toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Soil Moisture (live)" subtitle="Last readings">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Live sensor data is unavailable. Connect your backend source for monitoring.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#m)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Temperature & Humidity" subtitle="Combined trend">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Live sensor data is unavailable. Connect your backend source for monitoring.
            </div>
          ) : (
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
                  dataKey="temperature"
                  stroke="oklch(0.78 0.16 75)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="oklch(0.72 0.17 142)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
