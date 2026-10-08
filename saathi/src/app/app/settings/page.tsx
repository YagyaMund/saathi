import { AppShell } from "@/components/app-shell";
import { Chevron } from "@/components/icons";
import { requireSession } from "@/lib/auth";
import { getShopBundle } from "@/lib/shop-data";
import { SettingsClient } from "./ui";

const STAFF: { key: string; title: string; sub: string }[] = [
  { key: "post_reader", title: "Turn my posts into items", sub: "Reads each post and drafts the listing" },
  { key: "gap_filler", title: "Ask me what's missing", sub: "Price, pieces, sizes" },
  { key: "post_reviewer", title: "Review my posts and photos", sub: "Suggests only — never edits" },
  { key: "comment_responder", title: "Reply to comments", sub: "Answers publicly, then sends details privately" },
  { key: "salesperson", title: "Answer my DMs", sub: "Only from your approved items" },
  { key: "negotiator", title: "Bargain with customers", sub: "Never below the lowest price you set" },
  { key: "payment_verifier", title: "Check payment screenshots", sub: "Flags anything that doesn't match" },
  { key: "shift_manager", title: "Call me when a customer needs me", sub: "Sends a notification to this phone" },
  { key: "shop_analyst", title: "Evening report", sub: "A voice note every day at 8 pm" },
];

export default async function SettingsPage() {
  const session = await requireSession();
  const data = await getShopBundle(session.shopId);
  const shop = data.shop;

  return (
    <AppShell
      title="Settings"
      sub={`${shop.name} · ${shop.city}`}
      tab=""
      backHref="/app"
      needsCount={data.needsCount}
    >
      <div className="sec">
        <div className="sec-h"><span className="sec-t">Instagram</span></div>
        <div className="panel">
          <div className="srow">
            <span className="av" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>S</span>
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>{shop.instagramHandle || "Not connected"}</span>
              <span className="sv" style={{ display: "block" }}>
                {shop.instagramSim ? "Simulated · " : ""}
                {shop.instagramFollowers.toLocaleString("en-IN")} followers
              </span>
            </span>
            <span className="chip ok">Live</span>
          </div>
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>What Saathi can do</span>
              <span className="sv" style={{ display: "block" }}>
                Read your posts · reply to DMs · reply to comments
              </span>
            </span>
            <span className="chev"><Chevron /></span>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Your shop</span></div>
        <div className="panel">
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>Shop name</span>
              <span className="sv" style={{ display: "block" }}>{shop.name}</span>
            </span>
          </div>
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>City</span>
              <span className="sv" style={{ display: "block" }}>{shop.city}</span>
            </span>
          </div>
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>Your UPI QR</span>
              <span className="sv" style={{ display: "block" }}>{shop.upiId || "Not set"}</span>
            </span>
            {shop.upiId ? <span className="chip ok">Set</span> : null}
          </div>
        </div>
      </div>

      <SettingsClient
        flags={data.agentFlags}
        staff={STAFF}
        googleConnected={shop.googleConnected}
        googleEmail={shop.googleEmail}
        userEmail={session.email}
      />
    </AppShell>
  );
}
