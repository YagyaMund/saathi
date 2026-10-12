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
      <div className="thread-wrap">
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
              <div key={m.id} className="escalation">
                <div className="esc-t">{parsed.title}</div>
                <div className="esc-d">{parsed.detail}</div>
              </div>
            );
          }
          const cls =
            m.sender === "buyer"
              ? "bub them"
              : m.kind === "holding"
                ? "bub them"
                : "bub us";
          return (
            <div key={m.id} className={cls}>
              {m.body}
            </div>
          );
        })}
      </div>

      {needsSeller ? (
        <div className="sec pad-b">
          <div className="sec-h">
            <span className="sec-t">Answer in one line</span>
          </div>
          <div className="quick-pick">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                className="btn ghost"
                data-selected={selected === q ? "true" : "false"}
                onClick={() => setSelected(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="composer">
            <button
              className="iconbtn"
              aria-label="Hold to speak your answer"
              type="button"
            >
              <MicIcon />
            </button>
            <button className="btn" disabled={busy} onClick={send} type="button">
              Send and let Saathi carry on
            </button>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-2)",
              marginTop: 9,
              textAlign: "center",
              lineHeight: 1.45,
            }}
          >
            {note}
          </div>
        </div>
      ) : null}
    </>
  );
}
