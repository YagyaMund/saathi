"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Convo = {
  id: string;
  buyerName: string;
  lastPreview: string;
  lastAt: string;
  needsSeller: boolean;
  chip: string | null;
  chipTone: string;
  windowHoursLeft: number | null;
};

function ago(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} hr`;
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function MessagesClient({ conversations }: { conversations: Convo[] }) {
  const [filter, setFilter] = useState<"needs" | "all">("needs");
  const need = useMemo(
    () => conversations.filter((c) => c.needsSeller),
    [conversations],
  );
  const handled = useMemo(
    () => conversations.filter((c) => !c.needsSeller),
    [conversations],
  );
  const shown = filter === "needs" ? need : conversations;

  return (
    <>
      <div className="seg" role="group" aria-label="Filter messages">
        <button
          type="button"
          aria-pressed={filter === "needs"}
          onClick={() => setFilter("needs")}
        >
          Needs you · {need.length}
        </button>
        <button
          type="button"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All · {conversations.length}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="empty-panel">
          {filter === "needs"
            ? "Nothing needs you right now."
            : "No conversations yet."}
        </div>
      ) : (
        <div className="panel">
          {shown.map((c) => (
            <Link key={c.id} className="row mrow" href={`/app/messages/${c.id}`}>
              <span
                className="av"
                style={
                  c.needsSeller
                    ? {
                        background: "var(--warn-soft)",
                        color: "var(--warn)",
                        borderColor: "var(--warn-line)",
                      }
                    : undefined
                }
              >
                {c.buyerName[0]}
              </span>
              <span className="mrow-copy">
                <span className="nm">{c.buyerName}</span>
                <span className="ms">{c.lastPreview}</span>
                {c.chip ? (
                  <span className="mrow-chip">
                    <span
                      className={`chip ${c.chipTone === "ok" ? "ok" : c.needsSeller ? "warn" : ""}`}
                    >
                      {c.chip}
                    </span>
                  </span>
                ) : null}
              </span>
              <span className="meta">
                {ago(c.lastAt)}
                {c.windowHoursLeft != null ? (
                  <>
                    <br />
                    <span className="meta-warn">{c.windowHoursLeft}h left</span>
                  </>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      )}

      {filter === "needs" && handled.length > 0 ? (
        <div className="sec sec-flush">
          <div className="sec-h pad-x">
            <span className="sec-t">Saathi handled these</span>
          </div>
          <div className="panel">
            {handled.map((c) => (
              <Link
                key={c.id}
                className="row mrow"
                href={`/app/messages/${c.id}`}
              >
                <span className="av">{c.buyerName[0]}</span>
                <span className="mrow-copy">
                  <span className="nm">{c.buyerName}</span>
                  <span className="ms">{c.lastPreview}</span>
                  {c.chip ? (
                    <span className="mrow-chip">
                      <span
                        className={`chip ${c.chipTone === "ok" ? "ok" : ""}`}
                      >
                        {c.chip}
                      </span>
                    </span>
                  ) : null}
                </span>
                <span className="meta">{ago(c.lastAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
