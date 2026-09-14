import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { updateMemory } from "@/lib/store";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  return NextResponse.json({ memory: user.memory });
}

const putSchema = z.object({
  updates: z.record(z.string(), z.string().max(500)).refine((o) => Object.keys(o).length <= 12, {
    message: "Too many keys",
  }),
});

export async function PUT(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid memory payload." }, { status: 400 });
  }

  const memory = await updateMemory(user.id, parsed.data.updates);
  return NextResponse.json({ memory });
}
