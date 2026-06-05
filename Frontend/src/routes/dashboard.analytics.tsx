import { createFileRoute } from "@tanstack/react-router";
import { Brain, Sparkles, AlertTriangle, Droplets } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "../lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type SensorReading = {
  time: string;
  moisture: number;
  temperature: number;
  humidity: number;
  oxygen: number;
};

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SFMS" }] }),
  component: Analytics,
});

function Analytics() {
  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["readings-long"],
    queryFn: () => api.analytics.getReadings(50),
    refetchInterval: 30000,
  });

  const { data: aiInsights } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: () => api.ai.getInsights("default-farm"), // placeholder
    enabled: true,
  });

  const chartData: SensorReading[] = readings.map((r: any) => ({
    time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    moisture: r.soil_moisture,
    temperature: r.temperature,
    humidity: r.humidity,
    oxygen: 7.2,
  }));

  const insights = [
    {
      icon: Droplets,
      title: "Irrigation recommended",
      desc: aiInsights?.irrigation || "Optimal window in 2 hours for Zone 3.",
      tone: "bg-primary/10 text-primary",
    },
    {
      icon: AlertTriangle,
      title: "High risk of drought",
      desc: aiInsights?.drought || "South Orchard moisture trending down 12% over 24h.",
      tone: "bg-warning/20 text-warning-foreground",
    },
    {
      icon: Sparkles,
      title: "Yield boost",
      desc: aiInsights?.yield || "Tomatoes (Zone 1) on track for +18% vs last cycle.",
      tone: "bg-success/15 text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Trends, comparisons and AI recommendations.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {insights.map((i) => {
          const Icon = i.icon;
          return (
            <div
              key={i.title}
              className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${i.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-display text-base font-bold">{i.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{i.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-bold">AI Insights</p>
            <p className="text-sm text-muted-foreground">
              Based on the last 30 days, your fields are 22% more efficient. Consider lowering Zone
              4 irrigation by 15% to save water without yield loss.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-bold">Soil moisture (history)</h3>
          {isLoading ? (
            <div className="flex h-[280px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Analytics data is unavailable. Connect your backend to display charts.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
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
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-bold">Temperature trend</h3>
          {isLoading ? (
            <div className="flex h-[280px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Analytics data is unavailable. Connect your backend to display charts.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
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
                <Bar dataKey="temperature" fill="oklch(0.78 0.16 75)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
