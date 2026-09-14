"use client";

import { cn } from "@/lib/utils";
import type { TimeOfDay } from "@/lib/time-of-day";

type Props = {
  name: string;
  timeOfDay: TimeOfDay;
  portraitDay: string;
  portraitNight: string;
  speaking?: boolean;
  connected?: boolean;
  className?: string;
};

export function MiraPresence({
  name,
  timeOfDay,
  portraitDay,
  portraitNight,
  speaking = false,
  connected = true,
  className,
}: Props) {
  const src = timeOfDay === "night" ? portraitNight : portraitDay;
  const look = timeOfDay === "night" ? "Night · cozy hoodie" : "Day · clean sweater";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.6rem] border border-white/12 bg-[#12081f] shadow-[0_0_60px_rgba(124,58,237,0.28)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.18),transparent_55%)]" />
      <div className={cn("relative aspect-[3/4] w-full", speaking && "animate-soft-pulse")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${name} — looping presence portrait`}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition duration-700",
            connected ? "scale-100 opacity-100" : "scale-105 opacity-70",
            speaking && "brightness-110",
          )}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light",
            "animate-presence-breathe",
          )}
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.12), transparent 45%)",
          }}
        />
      </div>

      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            connected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-400",
          )}
        />
        {connected ? "On call" : "Connecting…"}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">{name}</p>
            <p className="text-xs text-white/55">{look}</p>
          </div>
          {speaking ? (
            <div className="flex h-8 items-end gap-0.5 pb-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-[var(--accent-bright)] animate-voice-bar"
                  style={{ animationDelay: `${i * 0.12}s`, height: "40%" }}
                />
              ))}
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/35">
          Animated presence · not live lip-sync
        </p>
      </div>
    </div>
  );
}
