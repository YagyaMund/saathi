import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ItemsOrdersSeg } from "@/components/items-orders-seg";
import { requireShopSession } from "@/lib/auth";
import { inr } from "@/lib/money";
import { getShopBundle, TONE } from "@/lib/shop-data";
import { PdfButton } from "./pdf-button";

export default async function ItemsPage() {
  const session = await requireShopSession();
  const data = await getShopBundle(session.shopId);

  return (
    <AppShell
      title="Your items"
      sub={`${data.items.length} in catalogue · approved only`}
      tab="items"
      needsCount={data.needsCount}
    >
      <div className="items-top">
        <ItemsOrdersSeg
          active="items"
          itemCount={data.items.length}
          orderCount={data.orders.length}
        />
        <Link className="btn sm toolbar-add" href="/app/items/new">
          Add
        </Link>
      </div>

      <div className="igrid">
        {data.items.map((item) => {
          const stock = item.variants.reduce((a, v) => a + v.stock, 0);
          const soldOut = item.status === "sold_out" || stock === 0;
          return (
            <Link
              key={item.id}
              className={`igrid-card${soldOut ? " sold" : ""}`}
              href={`/app/items/${item.id}`}
            >
              <span
                className="igrid-tone"
                style={{
                  background: TONE[item.thumbTone] || "var(--surface-3)",
                }}
              />
              {soldOut ? <span className="igrid-badge">Sold out</span> : null}
              <span className="igrid-meta">
                <span className="igrid-name">{item.name}</span>
                <span className="igrid-price">{inr(item.priceInr)}</span>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="sec pad-b">
        <PdfButton />
      </div>
    </AppShell>
  );
}
