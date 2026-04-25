"use client";

import { cn } from "@/lib/utils";

type Variant = "green" | "red" | "yellow" | "blue" | "gray" | "teal";

const VARIANTS: Record<Variant, string> = {
  green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
  yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  gray: "bg-white/10 text-white/60 border-white/10",
  teal: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export function Badge({
  children,
  variant = "gray",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
