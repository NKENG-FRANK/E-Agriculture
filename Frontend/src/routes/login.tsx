import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Logo } from "../components/Logo";
import { Sprout } from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — SFMS" },
      { name: "description", content: "Sign in to your Smart Farm Management dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "owner" | "sub_user">("owner");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.auth.login({
        email,
        password,
        role,
        remember_me: true, // simplified for now
      });

      // Store token and user info
      localStorage.setItem("sfms_token", response.access_token);
      localStorage.setItem("sfms_role", response.role);

      toast.success("Welcome back!");

      // Navigate based on role
      if (response.role === "admin") {
        navigate({ to: "/dashboard/admin" });
      } else if (response.role === "sub_user") {
        navigate({ to: "/dashboard", search: { role: "sub-user" } });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0_/_0.15),transparent_50%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Logo className="text-primary-foreground" />
          <div>
            <Sprout className="mb-6 h-12 w-12 opacity-80" />
            <h2 className="font-display text-4xl font-bold leading-tight">
              Welcome back to your farm.
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/80">
              Sign in to monitor real-time sensor data, AI insights, and control your irrigation system.
            </p>
          </div>
          <p className="text-xs text-primary-foreground/60">© 2026 SFMS</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-3xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to access the dashboard.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {(["admin", "owner", "sub_user"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border py-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                      role === r
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {r.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@farm.com"
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" />
                Remember me
              </label>
              <a href="#" className="font-medium text-primary hover:underline">Forgot?</a>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an invite?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">Register here</Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Want to join SFMS?{" "}
            <Link to="/book-a-meeting" className="font-semibold text-primary hover:underline">Book a Consultation</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
