"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign in");
      // Hard navigation so the new session cookie is always picked up by RSC.
      window.location.assign(data.hasBuddy ? "/" : "/pick");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  };

  const demoFill = () => {
    setName("Moe");
    setEmail("moe@shadow.ai");
  };

  return (
    <form
      onSubmit={onSubmit}
      action="#"
      method="post"
      className="mx-auto w-full max-w-md space-y-4"
      noValidate={false}
    >
      <div className="space-y-2">
        <label htmlFor="shadow-name" className="text-xs uppercase tracking-[0.16em] text-white/45">
          Name
        </label>
        <Input
          id="shadow-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What should Mira call you?"
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="shadow-email" className="text-xs uppercase tracking-[0.16em] text-white/45">
          Email
        </label>
        <Input
          id="shadow-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          autoComplete="email"
        />
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entering…" : "Continue"}
      </Button>
      <button
        type="button"
        onClick={demoFill}
        className="w-full text-center text-xs text-white/40 transition hover:text-white/70"
      >
        Use demo identity
      </button>
      <p className="text-center text-[11px] text-white/30">
        Demo login — no password. Buddy lock + memory persist for this email.
      </p>
    </form>
  );
}
