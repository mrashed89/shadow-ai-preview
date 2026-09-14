import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/store";
import { PickClient } from "@/components/pick-client";

export const dynamic = "force-dynamic";

export default async function PickPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session.id);
  if (!user) redirect("/login");
  if (user.buddyLock) redirect("/");

  return <PickClient userName={user.name} />;
}
