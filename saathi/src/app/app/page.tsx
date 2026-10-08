import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Chevron } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { requireSession } from "@/lib/auth";
import { inr } from "@/lib/money";
import { getShopBundle } from "@/lib/shop-data";

function relative(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr`;
}

export default async function HomePage() {
  const session = await requireSession();
  const data = await getShopBundle(session.shopId);
  const { shop, posts, orders, pendingDrafts, conversations, needsCount } = data;
  const snap = shop.analyticsSnap;
  const urgent = conversations.find((c) => c.needsSeller);
  const paymentIssue = conversations.find((c) =>
    (c.chip || "").toLowerCase().includes("match"),
  );

  return (
    <AppShell
      title={shop.name}
      sub={`Tuesday, 8 October · ${shop.instagramHandle || ""}`}
      tab="home"
      needsCount={needsCount}
    >
      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Needs you · {needsCount}</span>
        </div>
        <div className="tasks">
          {urgent ? (
            <Link className="task urgent" href={`/app/messages/${urgent.id}`}>
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.6-4.9A8.4 8.4 0 1 1 21 11.5z"/></svg>
              </span>
              <span className="tx">
                <span className="t1">{urgent.buyerName.split(" ")[0]} is waiting for an answer</span>
                <span className="t2">
                  {urgent.lastPreview} · {relative(urgent.lastAt)}
                </span>
              </span>
              <span className="chev"><Chevron /></span>
            </Link>
          ) : null}
          {pendingDrafts.length ? (
            <Link className="task" href="/app/approvals">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
              <span className="tx">
                <span className="t1">{pendingDrafts.length} items ready to approve</span>
                <span className="t2">From this morning&apos;s post · some need a price</span>
              </span>
              <span className="chev"><Chevron /></span>
            </Link>
          ) : null}
          {paymentIssue ? (
            <Link className="task" href={`/app/messages/${paymentIssue.id}`}>
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M6 10h5M6 14h8"/></svg>
              </span>
              <span className="tx">
                <span className="t1">{paymentIssue.buyerName.split(" ")[0]}&apos;s payment doesn&apos;t match</span>
                <span className="t2">{paymentIssue.lastPreview}</span>
              </span>
              <span className="chev"><Chevron /></span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Today</span></div>
        <div className="stats">
          <div className="stat"><div className="n">{snap?.todayOrders ?? 0}</div><div className="l">orders</div></div>
          <div className="stat"><div className="n">{inr(snap?.todayEarned ?? 0)}</div><div className="l">earned</div></div>
          <div className="stat"><div className="n">{snap?.todayMessages ?? 0}</div><div className="l">messages</div></div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Your posts</span>
          <Link className="link" href="/app/posts">Show more</Link>
        </div>
        <div className="pstrip">
          {posts.slice(0, 3).map((p) => (
            <Link key={p.id} className="pcard" href={`/app/posts/${p.id}`}>
              <span className="pimg" style={{ background: `var(--t-${p.thumbTone})` }} />
              <span className="pm">
                {p.postedAt.toLocaleDateString("en-IN", { weekday: "short" })} · {p.statusLabel}
              </span>
              {p.warnLabel ? <span className="pm warn">{p.warnLabel}</span> : <span className="pm">All live</span>}
            </Link>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">This week</span>
          <Link className="link" href="/app/analytics">All numbers</Link>
        </div>
        <div className="panel" style={{ padding: "15px 15px 16px" }}>
          <div style={{ display: "flex", gap: 18 }}>
            <div><div style={{ fontSize: 19, fontWeight: 700 }}>{snap?.weekPeople ?? 0}</div><div style={{ fontSize: 11.5, color: "var(--ink-2)" }}>people</div></div>
            <div><div style={{ fontSize: 19, fontWeight: 700 }}>{snap?.weekOrders ?? 0}</div><div style={{ fontSize: 11.5, color: "var(--ink-2)" }}>orders</div></div>
            <div><div style={{ fontSize: 19, fontWeight: 700 }}>{inr(snap?.weekEarned ?? 0)}</div><div style={{ fontSize: 11.5, color: "var(--ink-2)" }}>earned</div></div>
          </div>
          {shop.unmetAsks[0] ? (
            <>
              <div style={{ height: 1, background: "var(--line)", margin: "14px 0" }} />
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>
                {shop.unmetAsks[0].count} people asked for a {shop.unmetAsks[0].label.toLowerCase()}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 3, lineHeight: 1.45 }}>
                You only list single pieces. This is the biggest thing you&apos;re missing this week.
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Latest orders</span>
          <Link className="link" href="/app/items">Your items</Link>
        </div>
        <div className="panel">
          {orders.map((o) => (
            <div className="row" key={o.id}>
              <Thumb tone={o.items[0]?.name.toLowerCase().includes("puppet") ? "puppet" : "pottery"} w={36} h={44} />
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
                  {o.items[0]?.name || "Order"}
                </span>
                <span style={{ display: "block", fontSize: 12, color: o.status.includes("check") ? "var(--warn)" : "var(--ink-2)", marginTop: 2 }}>
                  {o.buyerName} · {o.status.replaceAll("_", " ")}
                </span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{inr(o.totalInr)}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
