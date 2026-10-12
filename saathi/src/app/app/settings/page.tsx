import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Chevron } from "@/components/icons";
import { requireShopSession } from "@/lib/auth";
import { preferGoogleAdc } from "@/lib/google/adc";
import { llmStatusDetail, llmStatusLabel } from "@/lib/llm";
import { metaConfigured, metaLoginPathChoice, metaRedirectUri } from "@/lib/meta/config";
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

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ig?: string; reason?: string }>;
}) {
  const session = await requireShopSession();
  const data = await getShopBundle(session.shopId);
  const shop = data.shop;
  const sp = await searchParams;
  const metaReady = metaConfigured();
  const llmLabel = llmStatusLabel();
  const llmDetail = llmStatusDetail();
  const vertexAdc = preferGoogleAdc();
  const connected = Boolean(shop.igUserId && shop.metaTokenEnc && !shop.instagramSim);
  const handle = (shop.instagramHandle || "").replace(/^@/, "");
  const initial = (shop.name.trim()[0] || "S").toUpperCase();

  return (
    <AppShell
      title={handle || shop.name}
      sub=""
      tab=""
      backHref="/app"
      needsCount={data.needsCount}
    >
      <div className="profile-head">
        <span
          className="av lg"
          style={{ background: "var(--surface-2)", color: "var(--ink)" }}
        >
          {initial}
        </span>
        <div className="profile-stats">
          <div>
            <span className="ps-n">{data.items.length}</span>
            <span className="ps-l">items</span>
          </div>
          <div>
            <span className="ps-n">
              {(shop.instagramFollowers || 0).toLocaleString("en-IN")}
            </span>
            <span className="ps-l">followers</span>
          </div>
          <div>
            <span className="ps-n">{data.pendingDrafts.length}</span>
            <span className="ps-l">approvals</span>
          </div>
        </div>
      </div>

      <div className="profile-bio">
        <div className="pb-name">{shop.name}</div>
        {handle ? <div className="pb-handle">@{handle}</div> : null}
        <div className="pb-city">
          {shop.city}
          {connected
            ? " · Connected via Instagram Login"
            : shop.instagramSim
              ? " · Simulated · demo data"
              : ""}
        </div>
      </div>

      <div className="profile-actions">
        <span className={`chip ${connected ? "ok" : ""}`}>
          {connected ? "Live" : "Sim"}
        </span>
      </div>

      <SettingsClient
        flags={data.agentFlags}
        staff={STAFF}
        googleConnected={shop.googleConnected}
        googleEmail={shop.googleEmail}
        userEmail={session.email}
        metaReady={metaReady}
        igConnected={connected}
        igFlash={sp.ig || null}
        igReason={sp.reason || null}
        llmLabel={llmLabel}
        llmDetail={llmDetail}
        vertexAdc={vertexAdc}
        loginPath={metaLoginPathChoice()}
        redirectHint={metaRedirectUri()}
      />

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Catalogue</span>
        </div>
        <div className="panel inset">
          <Link className="srow" href="/app/items">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>
                Your items
              </span>
              <span className="sv" style={{ display: "block" }}>
                {data.items.length} approved · make a catalogue PDF
              </span>
            </span>
            <span className="chev">
              <Chevron />
            </span>
          </Link>
          <Link className="srow" href="/app/approvals">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>
                Approvals
              </span>
              <span className="sv" style={{ display: "block" }}>
                {data.pendingDrafts.length} waiting for you
              </span>
            </span>
            <span className="chev">
              <Chevron />
            </span>
          </Link>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Your shop</span></div>
        <div className="panel inset">
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
    </AppShell>
  );
}
