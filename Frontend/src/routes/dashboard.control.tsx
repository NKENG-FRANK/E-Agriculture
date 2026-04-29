import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, Power, Sprout, Fan } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/control")({
  head: () => ({ meta: [{ title: "Control Panel — SFMS" }] }),
  component: ControlPanel,
});

function ControlPanel() {
  const [irrigation, setIrrigation] = useState(true);
  const [pump, setPump] = useState(false);
  const [fan, setFan] = useState(true);
  const [moistureThreshold, setMoistureThreshold] = useState(45);
  const [tempThreshold, setTempThreshold] = useState(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Control Panel</h1>
        <p className="text-sm text-muted-foreground">Manage devices and automation thresholds.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Toggle icon={Droplets} label="Irrigation system" desc="Auto-watering across all zones" value={irrigation} onChange={setIrrigation} />
        <Toggle icon={Power} label="Water pump" desc="Main pump (Zone 1–4)" value={pump} onChange={setPump} />
        <Toggle icon={Fan} label="Greenhouse fan" desc="Ventilation in Zone 2" value={fan} onChange={setFan} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Slider label="Moisture threshold" desc="Trigger irrigation below this value" unit="%" min={20} max={80} value={moistureThreshold} onChange={setMoistureThreshold} />
        <Slider label="Temperature threshold" desc="Trigger ventilation above this value" unit="°C" min={20} max={40} value={tempThreshold} onChange={setTempThreshold} />
      </div>

      <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Current system state</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { l: "Irrigation", v: irrigation ? "ON" : "OFF", on: irrigation },
            { l: "Pump", v: pump ? "RUNNING" : "IDLE", on: pump },
            { l: "Fan", v: fan ? "ACTIVE" : "OFF", on: fan },
            { l: "Auto mode", v: "ENABLED", on: true },
          ].map((s) => (
            <div key={s.l} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-sm font-medium">{s.l}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", s.on ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                {s.v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  icon: Icon, label, desc, value, onChange,
}: { icon: typeof Droplets; label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={cn(
            "relative h-7 w-12 rounded-full transition-colors",
            value ? "bg-primary" : "bg-muted",
          )}
        >
          <span className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-background shadow-soft transition-transform",
            value ? "translate-x-5" : "translate-x-0.5",
          )} />
        </button>
      </div>
      <p className="font-display text-base font-bold">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function Slider({
  label, desc, unit, min, max, value, onChange,
}: { label: string; desc: string; unit: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-display text-base font-bold">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <p className="font-display text-2xl font-bold text-primary">{value}{unit}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
