import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Chevron } from "@/components/icons";
import { requireShopSession } from "@/lib/auth";
import { inr } from "@/lib/money";
import { getShopBundle } from "@/lib/shop-data";

function relative(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function HomePage() {
  const session = await requireShopSession();
  const data = await getShopBundle(session.shopId);
  const { shop, posts, pendingDrafts, conversations, needsCount } = data;
  const snap = shop.analyticsSnap;
  const urgent = conversations.find((c) => c.needsSeller);
  const paymentIssue = conversations.find((c) =>
    (c.chip || "").toLowerCase().includes("match"),
  );

  return (
    <AppShell
      title={shop.name}
      sub={`${todayLabel()} · ${shop.instagramHandle || ""}`}
      tab="home"
      needsCount={needsCount}
    >
      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Needs you · {needsCount}</span>
          <Link className="link" href="/app/items">
            Items
          </Link>
        </div>
        <div className="tasks">
          {urgent ? (
            <Link className="task urgent" href={`/app/messages/${urgent.id}`}>
              <span className="ic">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.6-4.9A8.4 8.4 0 1 1 21 11.5z" />
                </svg>
              </span>
              <span className="tx">
                <span className="t1">
                  {urgent.buyerName.split(" ")[0]} is waiting for an answer
                </span>
                <span className="t2">
                  {urgent.lastPreview} · {relative(urgent.lastAt)}
                </span>
              </span>
              <span className="chev">
                <Chevron />
              </span>
            </Link>
          ) : null}
          {pendingDrafts.length ? (
            <Link className="task" href="/app/approvals">
              <span className="ic">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <span className="tx">
                <span className="t1">
                  {pendingDrafts.length} items ready to approve
                </span>
                <span className="t2">
                  From this morning&apos;s post · some need a price
                </span>
              </span>
              <span className="chev">
                <Chevron />
              </span>
            </Link>
          ) : null}
          {paymentIssue ? (
            <Link className="task" href={`/app/messages/${paymentIssue.id}`}>
              <span className="ic">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                  <path d="M6 10h5M6 14h8" />
                </svg>
              </span>
              <span className="tx">
                <span className="t1">
                  {paymentIssue.buyerName.split(" ")[0]}&apos;s payment
                  doesn&apos;t match
                </span>
                <span className="t2">{paymentIssue.lastPreview}</span>
              </span>
              <span className="chev">
                <Chevron />
              </span>
            </Link>
          ) : null}
          {!urgent && !pendingDrafts.length && !paymentIssue ? (
            <div className="empty-panel">
              Nothing waiting. Saathi is handling the rest.
            </div>
          ) : null}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Today</span>
          <Link className="link" href="/app/analytics">
            Week
          </Link>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="n">{snap?.todayOrders ?? 0}</div>
            <div className="l">orders</div>
          </div>
          <div className="stat">
            <div className="n">{inr(snap?.todayEarned ?? 0)}</div>
            <div className="l">earned</div>
          </div>
          <div className="stat">
            <div className="n">{snap?.todayMessages ?? 0}</div>
            <div className="l">messages</div>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Your posts</span>
          <Link className="link" href="/app/posts">
            Show more
          </Link>
        </div>
        <div className="pstrip">
          {posts.slice(0, 3).map((p) => (
            <Link key={p.id} className="pcard" href={`/app/posts/${p.id}`}>
              <span
                className="pimg"
                style={{ background: `var(--t-${p.thumbTone})` }}
              />
              <span className="pm">
                {p.postedAt.toLocaleDateString("en-IN", { weekday: "short" })}
              </span>
              <span className={`pm ${p.warnLabel ? "warn" : ""}`}>
                {p.warnLabel || p.statusLabel || "All live"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
