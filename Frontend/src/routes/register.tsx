import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — SFMS" },
      { name: "description", content: "Create your SFMS account and start monitoring your farm." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 font-display text-3xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start managing your farm in minutes.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {[
              { k: "name", label: "Full name", type: "text", placeholder: "Alex Farmer" },
              { k: "email", label: "Email", type: "email", placeholder: "you@farm.com" },
              { k: "password", label: "Password", type: "password", placeholder: "••••••••" },
              { k: "confirm", label: "Confirm password", type: "password", placeholder: "••••••••" },
            ].map((f) => (
              <div key={f.k}>
                <label className="mb-1.5 block text-sm font-medium">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.k as keyof typeof form]}
                  onChange={set(f.k as keyof typeof form)}
                  placeholder={f.placeholder}
                  className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            ))}
            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-hero lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,oklch(1_0_0_/_0.18),transparent_50%)]" />
        <div className="relative z-10 flex h-full items-center justify-center p-12">
          <div className="max-w-md text-primary-foreground">
            <h2 className="font-display text-4xl font-bold leading-tight">
              Grow more, with less.
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Join farmers using AI and IoT to cut water usage and boost yields.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {["Live sensor monitoring", "AI irrigation forecasts", "Automated control"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
