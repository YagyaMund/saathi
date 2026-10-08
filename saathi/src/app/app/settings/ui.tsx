"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsClient({
  flags,
  staff,
  googleConnected,
  googleEmail,
  userEmail,
}: {
  flags: Record<string, boolean>;
  staff: { key: string; title: string; sub: string }[];
  googleConnected: boolean;
  googleEmail: string | null;
  userEmail: string;
}) {
  const router = useRouter();
  const [agentFlags, setAgentFlags] = useState(flags);
  const [google, setGoogle] = useState(googleConnected);
  const [note, setNote] = useState("");

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
            <button className="btn ghost sm" onClick={connectGoogle}>
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
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 10, lineHeight: 1.5 }}>
          Google Sign-In is stubbed until OAuth client credentials exist. The UI
          and Sheet write fixture are ready.
          {note ? ` ${note}` : ""}
        </div>
      </div>

      <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <button className="btn ghost" onClick={switchSunita}>
          Open Sunita Handicrafts demo
        </button>
        <button className="btn ghost" onClick={logout}>
          Sign out
        </button>
      </div>
    </>
  );
}
