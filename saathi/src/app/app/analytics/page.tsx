import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Thumb } from "@/components/thumb";
import { requireShopSession } from "@/lib/auth";
import { inr } from "@/lib/money";
import { getShopBundle } from "@/lib/shop-data";
import { AnalystButton } from "./analyst-button";

export default async function AnalyticsPage() {
  const session = await requireShopSession();
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
  const topAsk = data.shop.unmetAsks[0];

  return (
    <AppShell
      title="Analytics"
      sub="This week · from your Sheet and chats"
      tab="analytics"
      needsCount={data.needsCount}
    >
      <div className="stats">
        <div className="stat">
          <div className="n">{snap?.weekPeople ?? 0}</div>
          <div className="l">people</div>
        </div>
        <div className="stat">
          <div className="n">{snap?.weekOrders ?? 0}</div>
          <div className="l">orders</div>
        </div>
        <div className="stat">
          <div className="n">{inr(snap?.weekEarned ?? 0)}</div>
          <div className="l">earned</div>
        </div>
      </div>

      {topAsk ? (
        <div className="sec">
          <div className="insight-panel">
            <div className="insight-title">
              {topAsk.count} people asked for a {topAsk.label.toLowerCase()}
            </div>
            <div className="insight-body">
              You only list single pieces. This is the biggest thing you&apos;re
              missing this week.
            </div>
          </div>
        </div>
      ) : null}

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Asked for, not available</span>
        </div>
        <div className="sec-lead">
          People asked for these in DMs and comments. You don&apos;t have them
          in the catalogue.
        </div>
        <div className="bar-list">
          {data.shop.unmetAsks.slice(0, 4).map((u) => (
            <div key={u.id} className="bar-item">
              <div className="bar-lab">
                <span>{u.label}</span>
                <span className="bar-n">{u.count}</span>
              </div>
              <div className="bar-t">
                <div
                  className="bar-f"
                  style={{ width: `${(u.count / maxAsk) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {data.shop.unmetAsks.length === 0 ? (
            <div className="empty-panel">No unmet asks this week.</div>
          ) : null}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Where people stopped</span>
        </div>
        <div className="sec-lead">People who didn&apos;t buy</div>
        <div className="bar-list">
          {dropoffs.map((d) => (
            <div key={d.label} className="bar-item">
              <div className="bar-lab">
                <span>{d.label}</span>
                <span className="bar-n">{d.count}</span>
              </div>
              <div className="bar-t">
                <div
                  className="bar-f mute"
                  style={{ width: `${(d.count / maxDrop) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {dropoffs.length === 0 ? (
            <div className="empty-panel">No drop-off data yet.</div>
          ) : null}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Best sellers</span>
          <Link className="link" href="/app/items">
            Your items
          </Link>
        </div>
        <div className="panel">
          {bestsellers.map((item) => (
            <Link key={item.id} className="row" href={`/app/items/${item.id}`}>
              <Thumb tone={item.thumbTone} w={34} h={42} />
              <span className="order-copy">
                <span className="order-title">{item.name}</span>
                <span className="order-meta">
                  {item.soldCount} sold · usually{" "}
                  {inr(item.usualPrice || item.priceInr)}
                </span>
              </span>
              <span className="order-amt">
                {inr((item.usualPrice || item.priceInr) * item.soldCount)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="sec">
        <AnalystButton latest={data.shop.eveningReports[0]?.body || ""} />
      </div>
    </AppShell>
  );
}
