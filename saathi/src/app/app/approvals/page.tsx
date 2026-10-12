import { AppShell } from "@/components/app-shell";
import { requireShopSession } from "@/lib/auth";
import { getShopBundle } from "@/lib/shop-data";
import { ApprovalsClient } from "./ui";

export default async function ApprovalsPage() {
  const session = await requireShopSession();
  const data = await getShopBundle(session.shopId);
  return (
    <AppShell
      title="Approve items"
      sub="Nothing goes live until you say yes"
      tab=""
      backHref="/app"
      needsCount={data.needsCount}
    >
      <ApprovalsClient
        drafts={data.drafts.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          priceInr: d.priceInr,
          stock: d.stock,
          sizesText: d.sizesText,
          thumbTone: d.thumbTone,
          missing: JSON.parse(d.missing || "[]") as string[],
          status: d.status,
        }))}
      />
    </AppShell>
  );
}
