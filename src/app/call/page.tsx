import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/store";
import { getBuddy } from "@/lib/buddies";
import { ageLabel, daysTogether } from "@/lib/time-of-day";
import { CallScreen } from "@/components/call-screen";

export const dynamic = "force-dynamic";

export default async function CallPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session.id);
  if (!user) redirect("/login");
  if (!user.buddyLock) redirect("/pick");

  const buddyMeta = getBuddy(user.buddyLock.buddyId);
  const days = daysTogether(user.buddyLock.lockedAt);

  return (
    <CallScreen
      userName={user.name}
      buddy={{
        id: user.buddyLock.buddyId,
        name: buddyMeta?.name ?? user.buddyLock.buddyId,
        lockedAt: user.buddyLock.lockedAt,
        daysTogether: days,
        ageLabel: ageLabel(days),
      }}
      initialMemory={user.memory}
      autoStart
    />
  );
}
