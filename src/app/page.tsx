import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/store";
import { getBuddy } from "@/lib/buddies";
import { ageLabel, daysTogether, getTimeOfDay } from "@/lib/time-of-day";
import { HomeClient } from "@/components/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session.id);
  if (!user) redirect("/login");

  const lock = user.buddyLock;
  const buddyMeta = lock ? getBuddy(lock.buddyId) : null;
  const days = lock ? daysTogether(lock.lockedAt) : 0;

  return (
    <HomeClient
      user={{ name: user.name, email: user.email }}
      buddy={
        lock
          ? {
              id: lock.buddyId,
              name: buddyMeta?.name ?? lock.buddyId,
              lockedAt: lock.lockedAt,
              daysTogether: days,
              ageLabel: ageLabel(days),
              timeOfDay: getTimeOfDay(),
            }
          : null
      }
    />
  );
}
