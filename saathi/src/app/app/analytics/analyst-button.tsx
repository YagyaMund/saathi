"use client";

import { useState } from "react";

export function AnalystButton({ latest }: { latest: string }) {
  const [body, setBody] = useState(latest);
  const [mode, setMode] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const res = await fetch("/api/analyst", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMode(data.error || "failed");
      return;
    }
    setBody(data.report?.body || "");
    const label =
      data.mode === "gemini"
        ? "Gemini"
        : data.mode === "llm"
          ? "LLM"
          : data.mode === "mock"
            ? "Mock"
            : data.mode;
    setMode(`${label} · TTS ${data.tts}`);
  }

  return (
    <div
      style={{
        background: "var(--surface-2)",
        borderRadius: "var(--r)",
        padding: "14px 15px",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        Evening report
      </div>
      {body ? (
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
          {body}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>No report yet.</div>
      )}
      <button
        className="btn"
        style={{ marginTop: 12 }}
        disabled={busy}
        onClick={run}
      >
        Run Shop Analyst now
      </button>
      {mode ? (
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>
          {mode}
        </div>
      ) : null}
    </div>
  );
}
