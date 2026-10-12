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

function initial(title: string) {
  return (title.trim()[0] || "?").toUpperCase();
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

  const needs: {
    key: string;
    href: string;
    title: string;
    detail: string;
    mark: string;
    urgent?: boolean;
  }[] = [];

  if (urgent) {
    needs.push({
      key: "urgent",
      href: `/app/messages/${urgent.id}`,
      title: `${urgent.buyerName.split(" ")[0]} is waiting for an answer`,
      detail: `${urgent.lastPreview} · ${relative(urgent.lastAt)}`,
      mark: initial(urgent.buyerName),
      urgent: true,
    });
  }
  if (pendingDrafts.length) {
    needs.push({
      key: "approvals",
      href: "/app/approvals",
      title: `${pendingDrafts.length} items ready to approve`,
      detail: "From this morning's post · some need a price",
      mark: "A",
    });
  }
  if (paymentIssue) {
    needs.push({
      key: "payment",
      href: `/app/messages/${paymentIssue.id}`,
      title: `${paymentIssue.buyerName.split(" ")[0]}'s payment doesn't match`,
      detail: paymentIssue.lastPreview,
      mark: initial(paymentIssue.buyerName),
      urgent: true,
    });
  }

  return (
    <AppShell
      title={shop.name}
      sub={`${todayLabel()} · ${shop.instagramHandle || ""}`}
      tab="home"
      needsCount={needsCount}
    >
      <div className="sec sec-flush">
        <div className="sec-h pad-x">
          <span className="sec-t">Needs you · {needs.length || needsCount}</span>
        </div>
        {needs.length === 0 ? (
          <div className="empty-panel">
            Nothing waiting. Saathi is handling the rest.
          </div>
        ) : (
          <div className="need-list">
            {needs.map((n) => (
              <Link
                key={n.key}
                className={`need-row${n.urgent ? " urgent" : ""}`}
                href={n.href}
              >
                <span className="need-av">{initial(n.title)}</span>
                <span className="need-copy">
                  <span className="need-title">{n.title}</span>
                  <span className="need-detail">{n.detail}</span>
                </span>
                <span className="chev">
                  <Chevron />
                </span>
              </Link>
            ))}
          </div>
        )}
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

      <div className="sec sec-flush">
        <div className="sec-h pad-x">
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
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
