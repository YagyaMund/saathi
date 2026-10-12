import { AppShell } from "@/components/app-shell";
import { ItemsOrdersSeg } from "@/components/items-orders-seg";
import { Thumb } from "@/components/thumb";
import { requireShopSession } from "@/lib/auth";
import { inr } from "@/lib/money";
import { getShopBundle } from "@/lib/shop-data";

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("check") || s.includes("match") || s.includes("wait")) {
    return "warn";
  }
  if (s.includes("paid") || s.includes("done") || s.includes("ship")) {
    return "ok";
  }
  return "";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default async function OrdersPage() {
  const session = await requireShopSession();
  const data = await getShopBundle(session.shopId);
  const orders = data.orders;

  return (
    <AppShell
      title="Orders"
      sub={`${orders.length} recent · from chats and Sheet`}
      tab="items"
      needsCount={data.needsCount}
    >
      <ItemsOrdersSeg
        active="orders"
        itemCount={data.items.length}
        orderCount={orders.length}
      />

      {orders.length === 0 ? (
        <div className="empty-panel" style={{ marginTop: 14 }}>
          No orders yet. When a buyer confirms, it will show up here.
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 14 }}>
          {orders.map((o) => {
            const tone = statusTone(o.status);
            const first = o.items[0];
            const thumbTone = first?.name.toLowerCase().includes("puppet")
              ? "puppet"
              : first?.name.toLowerCase().includes("bangle")
                ? "lac"
                : "pottery";
            return (
              <div className="row order-row" key={o.id}>
                <Thumb tone={thumbTone} w={36} h={44} />
                <span className="order-copy">
                  <span className="order-title">
                    {first?.name || "Order"}
                    {o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
                  </span>
                  <span className="order-meta">
                    {o.buyerName}
                    {tone ? (
                      <>
                        {" · "}
                        <span className={`chip ${tone}`}>
                          {statusLabel(o.status)}
                        </span>
                      </>
                    ) : (
                      <> · {statusLabel(o.status)}</>
                    )}
                  </span>
                </span>
                <span className="order-amt">{inr(o.totalInr)}</span>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
