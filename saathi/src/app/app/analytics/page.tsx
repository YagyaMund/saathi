import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Thumb } from "@/components/thumb";
import { requireSession } from "@/lib/auth";
import { inr } from "@/lib/money";
import { getShopBundle } from "@/lib/shop-data";
import { AnalystButton } from "./analyst-button";

export default async function AnalyticsPage() {
  const session = await requireSession();
  const data = await getShopBundle(session.shopId);
  const snap = data.shop.analyticsSnap;
  const dropoffs = JSON.parse(snap?.dropoffsJson || "[]") as {
    label: string;
    count: number;
  }[];
  const maxAsk = Math.max(...data.shop.unmetAsks.map((u) => u.count), 1);
  const maxDrop = Math.max(...dropoffs.map((d) => d.count), 1);
  const bestsellers = [...data.items]
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 3);

  return (
    <AppShell
      title="Numbers"
      sub="This week · from your Sheet and chats"
      tab="home"
      backHref="/app"
      needsCount={data.needsCount}
    >
      <div className="seg">
        <button aria-pressed="true">This week</button>
        <button aria-pressed="false">This month</button>
      </div>

      <div className="stats">
        <div className="stat"><div className="n">{snap?.weekPeople ?? 0}</div><div className="l">people</div></div>
        <div className="stat"><div className="n">{snap?.weekOrders ?? 0}</div><div className="l">orders</div></div>
        <div className="stat"><div className="n">{inr(snap?.weekEarned ?? 0)}</div><div className="l">earned</div></div>
      </div>

      <div className="sec">
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          People asked for these. You don&apos;t have them.
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 3 }}>
          Counted by how many different people asked
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 15 }}>
          {data.shop.unmetAsks.slice(0, 3).map((u) => (
            <div key={u.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 13 }}>{u.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{u.count}</span>
              </div>
              <div className="bar-t">
                <div className="bar-f" style={{ width: `${(u.count / maxAsk) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div style={{ fontSize: 15, fontWeight: 600 }}>Where people stopped</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 3 }}>
          People who didn&apos;t buy
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 15 }}>
          {dropoffs.map((d) => (
            <div key={d.label}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 13 }}>{d.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{d.count}</span>
              </div>
              <div className="bar-t">
                <div className="bar-f mute" style={{ width: `${(d.count / maxDrop) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Best sellers</span>
          <Link className="link" href="/app/items">Your items</Link>
        </div>
        <div className="panel">
          {bestsellers.map((item) => (
            <Link key={item.id} className="row" href={`/app/items/${item.id}`}>
              <Thumb tone={item.thumbTone} w={34} h={42} />
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{item.name}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>
                  {item.soldCount} sold · usually {inr(item.usualPrice || item.priceInr)}
                </span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {inr((item.usualPrice || item.priceInr) * item.soldCount)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="sec">
        <AnalystButton
          latest={data.shop.eveningReports[0]?.body || ""}
        />
      </div>
    </AppShell>
  );
}
