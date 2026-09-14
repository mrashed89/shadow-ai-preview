"use client";

import { useState } from "react";
import { BUDDIES } from "@/lib/buddies";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lock, Sparkles } from "lucide-react";

export function PickClient({ userName }: { userName: string }) {
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lockMira = async () => {
    setLocking(true);
    setError(null);
    try {
      const res = await fetch("/api/buddy/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buddyId: "mira" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not lock buddy");
      window.location.assign("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLocking(false);
    }
  };

  return (
    <div className="relative min-h-dvh px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.2),transparent_50%)]" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Shadow AI</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-white sm:text-5xl">
          Pick your Shadow
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/55">
          Hey {userName.split(" ")[0]} — this pick is forever for your account. Mira is ready now;
          the rest of the roster unlocks later.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {BUDDIES.map((buddy) => {
            const featured = buddy.id === "mira";
            return (
              <div
                key={buddy.id}
                className={cn(
                  "relative overflow-hidden rounded-3xl border p-4 transition",
                  featured
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 shadow-[0_0_40px_rgba(124,58,237,0.2)]"
                    : "border-white/10 bg-white/4 opacity-75",
                )}
              >
                {featured && buddy.portraitDay ? (
                  <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={buddy.portraitDay}
                      alt={buddy.name}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#110a1c] via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-black/40 text-white/30">
                    <Lock className="h-8 w-8" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{buddy.name}</h2>
                    <p className="text-xs text-white/45">{buddy.ageHint}</p>
                  </div>
                  {featured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/25 px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--accent-bright)]">
                      <Sparkles className="h-3 w-3" /> Featured
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-white/60">{buddy.tagline}</p>
                {featured ? (
                  <p className="mt-2 text-xs text-white/40">
                    Day: {buddy.dayLook} · Night: {buddy.nightLook}
                  </p>
                ) : null}
                {featured ? (
                  <Button className="mt-4 w-full" onClick={() => void lockMira()} disabled={locking}>
                    {locking ? "Locking forever…" : "Lock Mira forever"}
                  </Button>
                ) : (
                  <Button className="mt-4 w-full" variant="secondary" disabled>
                    Locked for later
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </div>
    </div>
  );
}
