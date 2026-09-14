import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { guideUser } from "@/lib/ai";
import { getBuddy } from "@/lib/buddies";
import { updateMemory } from "@/lib/store";

const bodySchema = z.object({
  message: z.string().max(2000).default(""),
  frameDataUrl: z.string().max(2_500_000).nullable().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(12)
    .optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid guidance request." }, { status: 400 });
  }

  const buddy = user.buddyLock ? getBuddy(user.buddyLock.buddyId) : null;

  const result = await guideUser({
    userMessage: parsed.data.message || "What should I do next on my screen?",
    frameDataUrl: parsed.data.frameDataUrl,
    history: parsed.data.history,
    memory: user.memory,
    userName: user.name,
    buddyName: buddy?.name || "Mira",
  });

  if (result.memoryUpdates && Object.keys(result.memoryUpdates).length) {
    await updateMemory(user.id, result.memoryUpdates);
  }

  return NextResponse.json(result);
}
