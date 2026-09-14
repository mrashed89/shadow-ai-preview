"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgeClock } from "@/components/age-clock";
import { Phone } from "lucide-react";

type BuddyInfo = {
  id: string;
  name: string;
  lockedAt: string;
  daysTogether: number;
  ageLabel: string;
  timeOfDay: string;
};

type Props = {
  user: { name: string; email: string };
  buddy: BuddyInfo | null;
};

export function HomeClient({ user, buddy }: Props) {
  const [loggingOut, setLoggingOut] = useState(false);
  const first = user.name.split(" ")[0];

  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.assign("/login");
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.28),transparent_68%)] blur-2xl" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(76,29,149,0.35),transparent_70%)] blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
          }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Forever video buddy</p>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          className="text-xs text-white/45 transition hover:text-white/80"
        >
          {loggingOut ? "…" : user.email}
        </button>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-3xl flex-col items-center justify-center px-5 pb-16 text-center sm:px-8">
        <p className="animate-fade-up font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight text-white sm:text-7xl">
          Shadow AI
        </p>
        <h1 className="animate-fade-up mt-5 max-w-xl text-balance text-xl text-white/80 sm:text-2xl [animation-delay:80ms]">
          {buddy
            ? `Hey ${first} — ${buddy.name} is already yours.`
            : `Hey ${first} — pick your forever Shadow, then call.`}
        </h1>
        <p className="animate-fade-up mt-3 max-w-md text-sm leading-relaxed text-white/50 [animation-delay:140ms]">
          Not chat with screenshots. A live video call with a friend who sees your screen and guides
          you click-by-click.
        </p>

        <div className="animate-fade-up mt-10 flex w-full max-w-sm flex-col items-center gap-4 [animation-delay:200ms]">
          {buddy ? (
            <>
              <Link href="/call" className="w-full sm:w-auto">
                <Button variant="call" className="w-full gap-3">
                  <Phone className="h-5 w-5" />
                  CALL {buddy.name.toUpperCase()}
                </Button>
              </Link>
              <AgeClock
                className="w-full text-left"
                daysTogether={buddy.daysTogether}
                ageLabel={buddy.ageLabel}
                lockedAt={buddy.lockedAt}
              />
            </>
          ) : (
            <Link href="/pick" className="w-full sm:w-auto">
              <Button variant="call" className="w-full">
                Pick your Shadow
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
