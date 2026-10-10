import { redirect } from "next/navigation";
import { getSession, requireShopSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Repair stale shop cookies before sending users into /app
  await requireShopSession();
  redirect("/app");
}
