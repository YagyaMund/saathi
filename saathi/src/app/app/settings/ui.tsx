"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function igFlashMessage(ig: string | null, reason: string | null): string {
  if (ig === "connected") return "Instagram connected. Posts are syncing.";
  if (ig === "denied") return "Instagram login was cancelled.";
  if (ig === "error") {
    if (reason === "need_professional") {
      return "You need an Instagram Professional account (Business or Creator). Switch in Instagram settings, then try again.";
    }
    if (reason === "missing_code") return "Login did not return a code. Try Connect again.";
    return reason ? `Could not connect: ${reason}` : "Could not connect Instagram.";
  }
  return "";
}

export function SettingsClient({
  flags,
  staff,
  googleConnected,
  googleEmail,
  userEmail,
  metaReady,
  igConnected,
  igFlash,
  igReason,
  llmLabel,
  loginPath,
  redirectHint,
}: {
  flags: Record<string, boolean>;
  staff: { key: string; title: string; sub: string }[];
  googleConnected: boolean;
  googleEmail: string | null;
  userEmail: string;
  metaReady: boolean;
  igConnected: boolean;
  igFlash: string | null;
  igReason: string | null;
  llmLabel: "Gemini" | "LLM" | "Mock";
  loginPath: string;
  redirectHint: string;
}) {
  const router = useRouter();
  const [agentFlags, setAgentFlags] = useState(flags);
  const [google, setGoogle] = useState(googleConnected);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const flash = useMemo(
    () => igFlashMessage(igFlash, igReason),
    [igFlash, igReason],
  );

  async function toggle(key: string) {
    const next = { ...agentFlags, [key]: !agentFlags[key] };
    setAgentFlags(next);
    await fetch("/api/settings/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flags: next }),
    });
  }

  async function connectGoogle() {
    const res = await fetch("/api/settings/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connect: !google, email: userEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setGoogle(!google);
      setNote(data.message || "");
      router.refresh();
    } else {
      setNote(data.error || "Failed");
    }
  }

  async function disconnectIg() {
    setBusy(true);
    setNote("");
    const res = await fetch("/api/auth/instagram/disconnect", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(data.error || "Disconnect failed");
      return;
    }
    router.refresh();
  }

  async function syncPosts() {
    setBusy(true);
    setNote("");
    const res = await fetch("/api/instagram/sync", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(data.error || "Sync failed");
      return;
    }
    setNote(`Imported ${data.imported} posts from Instagram.`);
    router.refresh();
  }

  async function switchSunita() {
    await fetch("/api/demo/switch-sunita", { method: "POST" });
    router.push("/app");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {(flash || note) && (
        <div className="note-panel" style={{ marginTop: 10 }}>
          {flash || note}
        </div>
      )}

      <div className="note-panel" style={{ marginTop: 10 }}>
        <strong style={{ display: "block", marginBottom: 4 }}>
          Before you connect
        </strong>
        Your Instagram must be a <strong>Professional</strong> account (Business
        or Creator). Saathi uses <strong>Instagram Login</strong>
        {loginPath === "instagram_login" ? "" : ""} — no Facebook Page required.
        We never publish or edit your posts.
        {!metaReady ? (
          <>
            {" "}
            <span style={{ color: "var(--warn, #b45309)" }}>
              Server is missing META_APP_ID / META_APP_SECRET — Connect stays
              disabled until those are set (see Meta App Review doc).
            </span>
          </>
        ) : null}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {igConnected ? (
          <>
            <button
              className="btn ghost sm"
              disabled={busy}
              onClick={syncPosts}
              type="button"
            >
              Sync posts
            </button>
            <button
              className="btn ghost sm"
              disabled={busy}
              onClick={disconnectIg}
              type="button"
            >
              Disconnect
            </button>
          </>
        ) : (
          <a
            className={`btn sm${metaReady ? "" : " disabled"}`}
            href={metaReady ? "/api/auth/instagram/start" : undefined}
            aria-disabled={!metaReady}
            onClick={(e) => {
              if (!metaReady) e.preventDefault();
            }}
            style={
              metaReady
                ? undefined
                : { opacity: 0.45, pointerEvents: "none" as const }
            }
          >
            Connect Instagram
          </a>
        )}
      </div>

      <div className="sec" style={{ marginTop: 22 }}>
        <div className="sec-h"><span className="sec-t">Agents / LLM</span></div>
        <div className="panel">
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>Model status</span>
              <span className="sv" style={{ display: "block" }}>
                {llmLabel === "Gemini"
                  ? "Gemini connected — production path"
                  : llmLabel === "LLM"
                    ? "LLM connected — interim demo key"
                    : "Mock replies — add GEMINI_API_KEY or LLM_API_KEY"}
              </span>
            </span>
            <span className={`chip ${llmLabel === "Mock" ? "" : "ok"}`}>
              {llmLabel === "Gemini"
                ? "Gemini"
                : llmLabel === "LLM"
                  ? "LLM connected"
                  : "Mock"}
            </span>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Your staff</span></div>
        <div className="panel">
          {staff.map((s) => (
            <div className="srow" key={s.key}>
              <span className="sl">
                <span className="sk" style={{ display: "block" }}>{s.title}</span>
                <span className="sv" style={{ display: "block" }}>{s.sub}</span>
              </span>
              <button
                className="sw"
                aria-pressed={Boolean(agentFlags[s.key])}
                aria-label={s.title}
                onClick={() => toggle(s.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Your records</span></div>
        <div className="panel">
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>Google Sheet</span>
              <span className="sv" style={{ display: "block" }}>
                Items, orders, customers — source of truth when connected
              </span>
            </span>
            <button className="btn ghost sm" onClick={connectGoogle} type="button">
              {google ? "Disconnect" : "Connect"}
            </button>
          </div>
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>Google account</span>
              <span className="sv" style={{ display: "block" }}>
                {google ? googleEmail || userEmail : "Not connected"}
              </span>
            </span>
            {google ? <span className="chip ok">Connected</span> : <span className="chip">Stub</span>}
          </div>
          <div className="srow">
            <span className="sl">
              <span className="sk" style={{ display: "block" }}>What Meta requires</span>
              <span className="sv" style={{ display: "block" }}>
                App Review, Business Verification, Advanced Access for other shops.
                Redirect URI: {redirectHint}
              </span>
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 10, lineHeight: 1.5 }}>
          Google Sign-In is stubbed until OAuth client credentials exist.
          {note && !flash ? ` ${note}` : ""}
        </div>
      </div>

      <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <button className="btn ghost" onClick={switchSunita} type="button">
          Open Sunita Handicrafts demo
        </button>
        <button className="btn ghost" onClick={logout} type="button">
          Sign out
        </button>
      </div>
    </>
  );
}
