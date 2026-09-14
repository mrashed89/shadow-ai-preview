import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { upsertUser } from "@/lib/store";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(120),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a name and valid email." }, { status: 400 });
  }

  const user = await upsertUser({
    email: parsed.data.email,
    name: parsed.data.name,
  });

  await createSession({ id: user.id, email: user.email, name: user.name });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    hasBuddy: Boolean(user.buddyLock),
    buddyId: user.buddyLock?.buddyId ?? null,
  });
}
