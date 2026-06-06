import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Sprout, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Users, 
  CheckCircle2,
  Menu,
  X,
  Smartphone,
  Cloud,
  Microscope,
  Activity,
  Brain,
  Droplets
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SFMS — Smart Farming Powered by AI" },
      { name: "description", content: "Monitor soil, irrigation and crop health in real time with AI-driven insights and IoT sensors." },
      { property: "og:title", content: "SFMS — Smart Farming Powered by AI" },
      { property: "og:description", content: "AI + IoT dashboard for modern farms." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#stats" className="hover:text-foreground">Insights</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted sm:inline-flex">
              Login
            </Link>
            <Link
              to="/book-a-meeting"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Book a Meeting <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/40 via-background to-background" />
        <div className="absolute -top-40 right-0 -z-10 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Sprout className="h-3.5 w-3.5" /> AI + IoT for modern farms
              </span>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Smart Farming<br />
                <span className="bg-gradient-hero bg-clip-text text-transparent">Powered by AI</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Monitor soil moisture, temperature, and crop health in real time. Let AI predict the perfect
                moment to irrigate — and automate it from anywhere.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/book-a-meeting"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted"
                >
                  Login
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                {["Real-time", "AI predictions", "Auto irrigation"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Mock dashboard preview */}
            <div className="relative">
              <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-glow">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">North Field · Live</p>
                    <p className="font-display text-lg font-bold">Zone 1 status</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Healthy
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Moisture", value: "68%", icon: Droplets, tone: "bg-primary/10 text-primary" },
                    { label: "Temp", value: "24°C", icon: Activity, tone: "bg-warning/15 text-warning-foreground" },
                    { label: "Humidity", value: "62%", icon: Droplets, tone: "bg-accent text-accent-foreground" },
                    { label: "AI Score", value: "9.2", icon: Brain, tone: "bg-primary-glow/20 text-primary" },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <div key={m.label} className="rounded-xl border border-border bg-card p-4">
                        <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${m.tone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                        <p className="font-display text-2xl font-bold">{m.value}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex h-20 items-end gap-1.5 rounded-xl bg-muted/40 p-3">
                  {[40, 55, 48, 62, 70, 68, 75, 72, 80, 76, 82, 78].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-primary to-primary-glow"
                      style={{ height: `${v}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold text-primary">FEATURES</p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight">Everything your farm needs in one place</h2>
            <p className="mt-3 text-muted-foreground">From soil sensors to AI-driven irrigation — all unified.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Activity,
                title: "Real-time monitoring",
                desc: "Live ESP32 sensor streams for soil moisture, temperature, humidity and water oxygen — all in one dashboard.",
              },
              {
                icon: Brain,
                title: "AI predictions",
                desc: "Forecast irrigation windows, detect drought risk early, and get tailored crop recommendations.",
              },
              {
                icon: Droplets,
                title: "Automated irrigation",
                desc: "Trigger pumps and valves remotely. Set thresholds — let SFMS act when the soil needs water.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border bg-gradient-card p-6 transition-all hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-t border-border/60 bg-muted/30 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-4">
          {[
            { v: "32%", l: "Less water used" },
            { v: "+18%", l: "Crop yield avg." },
            { v: "24/7", l: "Live monitoring" },
            { v: "5 min", l: "Setup per zone" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display text-5xl font-bold text-primary">{s.v}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center shadow-glow lg:p-16">
            <h2 className="text-4xl font-bold tracking-tight text-primary-foreground lg:text-5xl">
              Ready to grow smarter?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Join farmers using SFMS to save water, boost yields, and run their fields from anywhere.
            </p>
            <Link
              to="/book-a-meeting"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Start now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">© 2026 SFMS · Smart Farm Management System</p>
        </div>
      </footer>
    </div>
  );
}
