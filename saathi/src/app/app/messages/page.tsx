import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth";
import { getShopBundle } from "@/lib/shop-data";

function ago(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} hr`;
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default async function MessagesPage() {
  const session = await getSession();
  const data = await getShopBundle(session!.shopId);
  const need = data.conversations.filter((c) => c.needsSeller);
  const handled = data.conversations.filter((c) => !c.needsSeller);

  return (
    <AppShell
      title="Messages"
      sub="Instagram DMs · simulated"
      tab="messages"
      needsCount={data.needsCount}
    >
      <div className="seg" role="group" aria-label="Filter messages">
        <button aria-pressed="true">Needs you · {need.length}</button>
        <button aria-pressed="false">All · {data.conversations.length}</button>
      </div>

      <div className="panel">
        {need.map((c) => (
          <Link key={c.id} className="row mrow" href={`/app/messages/${c.id}`}>
            <span className="av" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
              {c.buyerName[0]}
            </span>
            <span style={{ flex: "1 1 auto", minWidth: 0 }}>
              <span className="nm" style={{ display: "block" }}>{c.buyerName}</span>
              <span className="ms" style={{ display: "block" }}>{c.lastPreview}</span>
              {c.chip ? (
                <span style={{ display: "inline-flex", marginTop: 6 }}>
                  <span className={`chip ${c.chipTone === "ok" ? "ok" : "warn"}`}>{c.chip}</span>
                </span>
              ) : null}
            </span>
            <span className="meta">
              {ago(c.lastAt)}
              {c.windowHoursLeft != null ? (
                <>
                  <br />
                  <span style={{ color: "var(--warn)", fontWeight: 600 }}>
                    {c.windowHoursLeft}h left
                  </span>
                </>
              ) : null}
            </span>
          </Link>
        ))}
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Saathi handled these</span></div>
        <div className="panel">
          {handled.map((c) => (
            <Link key={c.id} className="row mrow" href={`/app/messages/${c.id}`}>
              <span className="av">{c.buyerName[0]}</span>
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span className="nm" style={{ display: "block" }}>{c.buyerName}</span>
                <span className="ms" style={{ display: "block" }}>{c.lastPreview}</span>
                {c.chip ? (
                  <span style={{ display: "inline-flex", marginTop: 6 }}>
                    <span className={`chip ${c.chipTone === "ok" ? "ok" : ""}`}>{c.chip}</span>
                  </span>
                ) : null}
              </span>
              <span className="meta">{ago(c.lastAt)}</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
