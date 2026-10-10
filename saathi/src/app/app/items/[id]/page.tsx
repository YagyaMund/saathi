import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Thumb } from "@/components/thumb";
import { requireShopSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/money";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireShopSession();
  const { id } = await params;
  const item = await prisma.item.findFirst({
    where: { id, shopId: session.shopId },
    include: { variants: true },
  });
  if (!item) notFound();
  const stock = item.variants.reduce((a, v) => a + v.stock, 0);
  const asks = await prisma.unmetAsk.findMany({
    where: { shopId: session.shopId },
    orderBy: { count: "desc" },
    take: 2,
  });
  const needsCount = await prisma.conversation.count({
    where: { shopId: session.shopId, needsSeller: true },
  });

  return (
    <AppShell
      title={item.name}
      sub={`${item.category} · floor ${inr(item.floorInr)}`}
      tab="items"
      backHref="/app/items"
      needsCount={needsCount}
    >
      <div style={{ display: "flex", gap: 14 }}>
        <Thumb tone={item.thumbTone} w={104} h={128} />
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
            {item.name}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 7, lineHeight: 1.5 }}>
            {item.description}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10 }}>
            {inr(item.priceInr)}
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Stock</span></div>
        <div className="panel">
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>Available now</span>
              <span className="sv" style={{ display: "block" }}>
                Saathi will stop selling at zero
              </span>
            </span>
            <span className="chip ok">{stock} pieces</span>
          </div>
          {item.variants.map((v) => (
            <div className="srow" key={v.id}>
              <span className="sl">
                <span className="sk" style={{ display: "block" }}>{v.label}</span>
              </span>
              <span className={`chip ${v.stock === 0 ? "warn" : "ok"}`}>{v.stock}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">What it sold for</span></div>
        <div className="stats">
          <div className="stat"><div className="n">{item.soldCount}</div><div className="l">sold</div></div>
          <div className="stat"><div className="n">{inr(item.usualPrice || item.priceInr)}</div><div className="l">usual price</div></div>
          <div className="stat">
            <div className="n">{inr((item.usualPrice || item.priceInr) * item.soldCount)}</div>
            <div className="l">earned</div>
          </div>
        </div>
        <div className="panel" style={{ marginTop: 9 }}>
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>Your lowest allowed</span>
              <span className="sv" style={{ display: "block" }}>Saathi never goes below this</span>
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{inr(item.floorInr)}</span>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Asked for, not available</span></div>
        <div className="panel">
          {asks.map((a) => (
            <div className="srow" key={a.id}>
              <span className="sl">
                <span className="sk" style={{ display: "block" }}>{a.label}</span>
                <span className="sv" style={{ display: "block" }}>
                  {a.count} people asked
                </span>
              </span>
              <span className="chip warn">Missing</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
