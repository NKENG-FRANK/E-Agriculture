import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-display font-bold text-foreground ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
        <Sprout className="h-5 w-5 text-primary-foreground" />
      </span>
      <span className="text-lg tracking-tight">SFMS</span>
    </Link>
  );
}
