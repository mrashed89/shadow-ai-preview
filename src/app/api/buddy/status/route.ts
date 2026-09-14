import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBuddy } from "@/lib/buddies";
import { ageLabel, daysTogether, getTimeOfDay } from "@/lib/time-of-day";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const lock = user.buddyLock;
  if (!lock) {
    return NextResponse.json({ buddy: null });
  }

  const buddy = getBuddy(lock.buddyId);
  const days = daysTogether(lock.lockedAt);

  return NextResponse.json({
    buddy: {
      id: lock.buddyId,
      name: buddy?.name ?? lock.buddyId,
      lockedAt: lock.lockedAt,
      daysTogether: days,
      ageLabel: ageLabel(days),
      timeOfDay: getTimeOfDay(),
      portraitDay: buddy?.portraitDay,
      portraitNight: buddy?.portraitNight,
    },
  });
}
