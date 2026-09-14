import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/store";
import { ageLabel, daysTogether, getTimeOfDay } from "@/lib/time-of-day";
import { getBuddy } from "@/lib/buddies";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const lock = user.buddyLock;
  const buddy = lock ? getBuddy(lock.buddyId) : null;
  const days = lock ? daysTogether(lock.lockedAt) : 0;

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    buddy: lock
      ? {
          id: lock.buddyId,
          name: buddy?.name ?? lock.buddyId,
          lockedAt: lock.lockedAt,
          daysTogether: days,
          ageLabel: ageLabel(days),
          timeOfDay: getTimeOfDay(),
        }
      : null,
    memory: user.memory,
  });
}
