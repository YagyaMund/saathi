import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Chevron } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { requireSession } from "@/lib/auth";
import { inr } from "@/lib/money";
import { getShopBundle } from "@/lib/shop-data";
import { PdfButton } from "./pdf-button";

export default async function ItemsPage() {
  const session = await requireSession();
  const data = await getShopBundle(session.shopId);

  return (
    <AppShell
      title="Your items"
      sub={`${data.items.length} in catalogue · approved only`}
      tab="items"
      needsCount={data.needsCount}
    >
      <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 14 }}>
        <div className="seg" style={{ margin: 0, flex: "1 1 auto" }}>
          <button aria-pressed="true">All · {data.items.length}</button>
          <button aria-pressed="false">Pottery</button>
          <button aria-pressed="false">Low stock</button>
        </div>
        <Link className="btn sm" href="/app/items/new" style={{ height: 34, padding: "0 12px", fontSize: 13 }}>
          Add
        </Link>
      </div>

      <div className="panel">
        {data.items.map((item) => {
          const stock = item.variants.reduce((a, v) => a + v.stock, 0);
          const zeroVariant = item.variants.find((v) => v.stock === 0);
          return (
            <Link
              key={item.id}
              className="row"
              href={`/app/items/${item.id}`}
              style={{ opacity: item.status === "sold_out" ? 0.62 : 1 }}
            >
              <Thumb tone={item.thumbTone} />
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>
                  {item.name}
                </span>
                <span style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
                  {item.status === "sold_out" || stock === 0 ? (
                    <span className="chip warn">Sold out</span>
                  ) : (
                    <span className="chip ok">{stock} in stock</span>
                  )}
                  {zeroVariant ? (
                    <span className="chip warn">{zeroVariant.label} · none</span>
                  ) : null}
                </span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{inr(item.priceInr)}</span>
              <span className="chev"><Chevron /></span>
            </Link>
          );
        })}
      </div>

      <div className="sec">
        <PdfButton />
      </div>
    </AppShell>
  );
}
