import { AppShell } from "@/components/app-shell";
import { requireShopSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewItemPage() {
  const session = await requireShopSession();
  const needsCount = await prisma.conversation.count({
    where: { shopId: session.shopId, needsSeller: true },
  });

  return (
    <AppShell
      title="Add item"
      sub="Or post on Instagram and let Saathi draft it"
      tab="items"
      backHref="/app/items"
      needsCount={needsCount}
    >
      <div
        style={{
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-line)",
          borderRadius: "var(--r)",
          padding: "12px 14px",
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.5,
        }}
      >
        You don&apos;t have to do this. Post it on Instagram and Saathi will draft
        the item for you — this is for things you never posted.
      </div>
      <div
        style={{
          width: "100%",
          marginTop: 16,
          border: "1px dashed var(--line-2)",
          borderRadius: "var(--r-lg)",
          padding: "26px 16px",
          textAlign: "center",
          color: "var(--ink-2)",
          background: "var(--surface)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
          Take a photo or choose one
        </div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Manual add form ships next — Instagram post → draft is the main path.
        </div>
      </div>
    </AppShell>
  );
}
