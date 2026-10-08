"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MicIcon } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { inr, parseInr } from "@/lib/money";

type DraftRow = {
  id: string;
  name: string;
  description: string;
  priceInr: number | null;
  stock: number | null;
  sizesText: string | null;
  thumbTone: string;
  missing: string[];
  status: string;
};

export function ApprovalsClient({ drafts }: { drafts: DraftRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(
    drafts.map((d) => ({
      ...d,
      price: d.priceInr ? inr(d.priceInr) : "",
      stockText: d.stock != null ? String(d.stock) : "",
      sizes: d.sizesText || "",
    })),
  );
  const [note, setNote] = useState("Hold the mic and say the prices");
  const [busy, setBusy] = useState(false);

  const ready = useMemo(
    () =>
      rows.filter((r) => {
        if (r.status === "skipped") return false;
        const price = parseInr(r.price);
        const stock = Number(r.stockText.replace(/\D/g, ""));
        if (!price || Number.isNaN(stock)) return false;
        if (r.missing.includes("sizes") && !r.sizes.trim()) return false;
        return true;
      }),
    [rows],
  );

  async function approve() {
    setBusy(true);
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drafts: ready.map((r) => ({
          draftId: r.id,
          price: r.price,
          stock: Number(r.stockText.replace(/\D/g, "")),
          sizesText: r.sizes || null,
        })),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(data.error || "Could not approve");
      return;
    }
    setNote(`Approved ${data.approved?.length || 0} into your catalogue`);
    router.refresh();
    router.push("/app/items");
  }

  return (
    <>
      <div
        style={{
          background: "var(--surface-2)",
          borderRadius: "var(--r)",
          padding: "11px 13px",
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.45,
        }}
      >
        Nothing goes into your catalogue until you approve it. The approval gate
        is code — not the model.
      </div>

      <div className="sec" style={{ marginTop: 16 }}>
        <div className="panel">
          {rows.map((r, idx) => (
            <div className="row" key={r.id} style={{ alignItems: "flex-start" }}>
              <Thumb tone={r.thumbTone} w={46} h={58} />
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                  {r.name}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: r.missing.length || r.status === "skipped" ? "var(--warn)" : "var(--ink-2)",
                    marginTop: 3,
                  }}
                >
                  {r.description}
                </span>
                {r.status === "skipped" ? (
                  <div style={{ marginTop: 9 }}>
                    <button className="btn ghost sm" type="button">
                      Undo
                    </button>
                  </div>
                ) : (
                  <span style={{ display: "flex", gap: 8, marginTop: 9 }}>
                    <label style={{ flex: "1 1 0", minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 11, color: "var(--ink-2)", marginBottom: 4 }}>
                        Price
                      </span>
                      <input
                        value={r.price}
                        placeholder="₹ —"
                        onChange={(e) => {
                          const next = [...rows];
                          next[idx] = { ...r, price: e.target.value };
                          setRows(next);
                        }}
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 10px",
                          border: `1px solid ${r.missing.includes("price") && !r.price ? "var(--warn-line)" : "var(--line-2)"}`,
                          borderRadius: 8,
                          background: r.missing.includes("price") && !r.price ? "var(--warn-soft)" : "var(--surface)",
                          color: "var(--ink)",
                          fontSize: 14,
                        }}
                      />
                    </label>
                    <label style={{ flex: "1 1 0", minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 11, color: "var(--ink-2)", marginBottom: 4 }}>
                        {r.missing.includes("sizes") ? "Sizes" : "Pieces"}
                      </span>
                      <input
                        value={r.missing.includes("sizes") ? r.sizes : r.stockText}
                        placeholder={r.missing.includes("sizes") ? "2.4 / 2.6 / 2.8" : "—"}
                        onChange={(e) => {
                          const next = [...rows];
                          if (r.missing.includes("sizes")) {
                            next[idx] = { ...r, sizes: e.target.value };
                          } else {
                            next[idx] = { ...r, stockText: e.target.value };
                          }
                          setRows(next);
                        }}
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 10px",
                          border: "1px solid var(--line-2)",
                          borderRadius: 8,
                          background: "var(--surface)",
                          color: "var(--ink)",
                          fontSize: 14,
                        }}
                      />
                    </label>
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sec" style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <button
          className="iconbtn"
          aria-label="Hold to say the prices"
          style={{
            width: 48,
            height: 48,
            margin: 0,
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r)",
            color: "var(--ink)",
          }}
          type="button"
          onClick={() => setNote("Speech stub — type the prices for now")}
        >
          <MicIcon />
        </button>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <button className="btn" disabled={!ready.length || busy} onClick={approve}>
            Approve {ready.length} ready
          </button>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 7, textAlign: "center" }}>
            {note}
          </div>
        </div>
      </div>
    </>
  );
}
