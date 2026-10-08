"use client";

import { useState } from "react";

export function PdfButton() {
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    setNote("Generating…");
    const res = await fetch("/api/pdf", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(data.error || "Could not generate");
      return;
    }
    setUrl(data.downloadUrl);
    setNote("Ready. Download and share with the neighbourhood.");
  }

  return (
    <div>
      <button className="btn ghost" disabled={busy} onClick={generate}>
        Make a catalogue PDF to share
      </button>
      {note ? (
        <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 8, textAlign: "center" }}>
          {note}
        </div>
      ) : null}
      {url ? (
        <a className="btn" style={{ marginTop: 10 }} href={url}>
          Download PDF
        </a>
      ) : null}
    </div>
  );
}
