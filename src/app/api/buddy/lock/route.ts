import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getBuddy } from "@/lib/buddies";
import { lockBuddy, type UserRecord } from "@/lib/store";
import { ageLabel, daysTogether, getTimeOfDay } from "@/lib/time-of-day";

const bodySchema = z.object({
  buddyId: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a buddy." }, { status: 400 });
  }

  const buddy = getBuddy(parsed.data.buddyId);
  if (!buddy?.available) {
    return NextResponse.json({ error: "That Shadow isn't available yet." }, { status: 400 });
  }

  try {
    const locked = await lockBuddy(user.id, buddy.id);
    const lock = locked.buddyLock!;
    const days = daysTogether(lock.lockedAt);
    return NextResponse.json({
      buddy: {
        id: lock.buddyId,
        name: buddy.name,
        lockedAt: lock.lockedAt,
        daysTogether: days,
        ageLabel: ageLabel(days),
        timeOfDay: getTimeOfDay(),
      },
    });
  } catch (e) {
    const err = e as Error & { user?: UserRecord };
    if (err.message === "ALREADY_LOCKED" && err.user?.buddyLock) {
      return NextResponse.json(
        {
          error: "Your Shadow is already locked forever.",
          buddy: {
            id: err.user.buddyLock.buddyId,
            lockedAt: err.user.buddyLock.lockedAt,
          },
        },
        { status: 409 },
      );
    }
    throw e;
  }
}
