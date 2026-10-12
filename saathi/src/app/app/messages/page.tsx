import { AppShell } from "@/components/app-shell";
import { requireShopSession } from "@/lib/auth";
import { getShopBundle } from "@/lib/shop-data";
import { MessagesClient } from "./ui-list";

export default async function MessagesPage() {
  const session = await requireShopSession();
  const data = await getShopBundle(session.shopId);

  return (
    <AppShell
      title="Messages"
      sub="Instagram DMs · simulated"
      tab="messages"
      needsCount={data.needsCount}
    >
      <MessagesClient
        conversations={data.conversations.map((c) => ({
          id: c.id,
          buyerName: c.buyerName,
          lastPreview: c.lastPreview,
          lastAt: c.lastAt.toISOString(),
          needsSeller: c.needsSeller,
          chip: c.chip,
          chipTone: c.chipTone,
          windowHoursLeft: c.windowHoursLeft,
        }))}
      />
    </AppShell>
  );
}
