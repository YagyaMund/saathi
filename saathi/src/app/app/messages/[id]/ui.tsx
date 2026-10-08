"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MicIcon } from "@/components/icons";

const QUICK = [
  "I can make a 6-piece set for ₹4,200",
  "Sets take 10 days from the karigars",
  "Single pieces only right now",
];

export function ThreadClient({
  conversationId,
  needsSeller,
  messages,
}: {
  conversationId: string;
  needsSeller: boolean;
  messages: { id: string; sender: string; body: string; kind: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(QUICK[0]);
  const [note, setNote] = useState(
    "Saathi takes your answer and finishes the conversation. You don't have to open Instagram.",
  );
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const res = await fetch(`/api/messages/${conversationId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: selected }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setNote(data.error || "Could not send");
      return;
    }
    setNote("Sent. Saathi is carrying on now.");
    router.refresh();
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {messages.map((m) => {
          if (m.kind === "stopline") {
            return (
              <div className="stopline" key={m.id}>
                <span>{m.body}</span>
              </div>
            );
          }
          if (m.kind === "escalation") {
            let parsed = { title: "Needs you", detail: m.body };
            try {
              parsed = JSON.parse(m.body);
            } catch {
              /* keep */
            }
            return (
              <div
                key={m.id}
                style={{
                  background: "var(--warn-soft)",
                  border: "1px solid var(--warn-line)",
                  borderRadius: "var(--r)",
                  padding: "13px 14px",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--warn)" }}>
                  {parsed.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 5, lineHeight: 1.5 }}>
                  {parsed.detail}
                </div>
              </div>
            );
          }
          const cls =
            m.sender === "buyer"
              ? "bub them"
              : m.kind === "holding"
                ? "bub us"
                : "bub us";
          return (
            <div
              key={m.id}
              className={cls}
              style={
                m.kind === "holding"
                  ? { background: "var(--surface-2)", borderColor: "var(--line)" }
                  : undefined
              }
            >
              {m.body}
            </div>
          );
        })}
      </div>

      {needsSeller ? (
        <div className="sec">
          <div className="sec-h"><span className="sec-t">Answer in one line</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {QUICK.map((q) => (
              <button
                key={q}
                className="btn ghost"
                style={{
                  justifyContent: "flex-start",
                  padding: "0 14px",
                  height: 44,
                  fontWeight: 500,
                  fontSize: 14,
                  borderColor: selected === q ? "var(--accent)" : undefined,
                }}
                onClick={() => setSelected(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 11 }}>
            <button
              className="iconbtn"
              aria-label="Hold to speak your answer"
              style={{
                width: 48,
                height: 48,
                margin: 0,
                border: "1px solid var(--line-2)",
                borderRadius: "var(--r)",
              }}
              type="button"
            >
              <MicIcon />
            </button>
            <button className="btn" disabled={busy} onClick={send}>
              Send and let Saathi carry on
            </button>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 9, textAlign: "center", lineHeight: 1.45 }}>
            {note}
          </div>
        </div>
      ) : null}
    </>
  );
}
