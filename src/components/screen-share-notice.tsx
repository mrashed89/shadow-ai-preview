"use client";

import { Button } from "@/components/ui/button";
import { MonitorUp, Shield } from "lucide-react";

type Props = {
  open: boolean;
  buddyName: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export function ScreenShareNotice({ open, buddyName, onConfirm, onCancel, busy }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="animate-rise-in w-full max-w-md rounded-3xl border border-white/12 bg-[#110a1c] p-6 shadow-[0_0_80px_rgba(124,58,237,0.25)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/20 text-[var(--accent-bright)]">
          <MonitorUp className="h-6 w-6" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-white">
          This call shares your screen
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          When you tap Confirm & call, your browser will ask to share a window or display.{" "}
          {buddyName} picks up already looking at what you share — that's how live guidance works.
          No screenshot upload.
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs text-white/55">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-bright)]" />
          <span>
            You choose what to share. Stop sharing anytime from the browser or End call.
          </span>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? "Opening share…" : "Confirm & call"}
          </Button>
        </div>
      </div>
    </div>
  );
}
