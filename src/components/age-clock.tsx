"use client";

import { cn } from "@/lib/utils";

type Props = {
  daysTogether: number;
  ageLabel: string;
  lockedAt: string;
  className?: string;
};

export function AgeClock({ daysTogether, ageLabel, lockedAt, className }: Props) {
  const locked = new Date(lockedAt);
  const progress = Math.min(1, daysTogether / 365);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-white/55">
        <span>Aging with you</span>
        <span>Locked {locked.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-white/90">{ageLabel}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#c4b5fd] transition-all duration-700"
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-white/40">
        Forever buddy · subtle age clock (full aging graphics later)
      </p>
    </div>
  );
}
