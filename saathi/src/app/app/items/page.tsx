import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ItemsOrdersSeg } from "@/components/items-orders-seg";
import { Chevron } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { requireShopSession } from "@/lib/auth";
import { inr } from "@/lib/money";
import { getShopBundle } from "@/lib/shop-data";
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
              <span className="order-copy">
                <span className="order-title">{item.name}</span>
                <span className="item-chips">
                  {item.status === "sold_out" || stock === 0 ? (
                    <span className="chip warn">Sold out</span>
                  ) : (
                    <span className="chip ok">{stock} in stock</span>
                  )}
                  {zeroVariant ? (
                    <span className="chip warn">
                      {zeroVariant.label} · none
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="order-amt">{inr(item.priceInr)}</span>
              <span className="chev">
                <Chevron />
              </span>
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
