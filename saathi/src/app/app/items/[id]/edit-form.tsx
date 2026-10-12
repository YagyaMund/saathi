"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type VariantRow = { id: string; label: string; stock: number; sku: string };

export function ItemEditForm({
  item,
}: {
  item: {
    id: string;
    name: string;
    description: string;
    category: string;
    priceInr: number;
    floorInr: number;
    attributes: string;
    status: string;
    variants: VariantRow[];
  };
}) {
  const router = useRouter();
  const initialAttrs = useMemo(() => {
    try {
      return JSON.parse(item.attributes || "{}") as Record<string, string>;
    } catch {
      return {};
    }
  }, [item.attributes]);

  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState(item.category);
  const [price, setPrice] = useState(String(item.priceInr));
  const [floor, setFloor] = useState(String(item.floorInr));
  const [attrText, setAttrText] = useState(
    Object.entries(initialAttrs)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
  );
  const [variants, setVariants] = useState(
    item.variants.map((v) => ({ ...v, stockText: String(v.stock) })),
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  function parseAttrs(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of attrText.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      const i = t.indexOf(":");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim();
      if (k) out[k] = v;
    }
    return out;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        category,
        priceInr: Number(price.replace(/\D/g, "")),
        floorInr: Number(floor.replace(/\D/g, "")),
        attributes: parseAttrs(),
        variants: variants.map((v) => ({
          id: v.id,
          label: v.label,
          stock: Number(v.stockText.replace(/\D/g, "") || "0"),
        })),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(data.error || "Could not save");
      return;
    }
    setNote("Saved to catalogue" + (data.item ? "" : ""));
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          className="btn"
          onClick={() => setEditing(true)}
        >
          Edit item
        </button>
        {note ? (
          <div className="note-panel" style={{ marginTop: 10 }}>
            {note}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form className="sec" onSubmit={save}>
      <div className="sec-h">
        <span className="sec-t">Edit catalogue</span>
      </div>
      <div className="panel" style={{ padding: "12px 14px" }}>
        <label className="fld">
          <span className="fl">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="fld">
          <span className="fl">Category</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className="fld">
          <span className="fl">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label className="fld">
            <span className="fl">Price (₹)</span>
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="fld">
            <span className="fl">Floor (₹)</span>
            <input
              inputMode="numeric"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="fld">
          <span className="fl">Attributes (one per line: key: value)</span>
          <textarea
            value={attrText}
            onChange={(e) => setAttrText(e.target.value)}
            rows={4}
            placeholder={"material: quartz\nfood_safe: yes"}
            style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
          />
        </label>

        <div style={{ fontSize: 13, fontWeight: 600, margin: "8px 0 6px" }}>
          Stock per variant
        </div>
        {variants.map((v, idx) => (
          <div
            key={v.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 88px",
              gap: 8,
              marginBottom: 8,
              alignItems: "end",
            }}
          >
            <label className="fld" style={{ margin: 0 }}>
              <span className="fl">Label</span>
              <input
                value={v.label}
                onChange={(e) => {
                  const next = [...variants];
                  next[idx] = { ...v, label: e.target.value };
                  setVariants(next);
                }}
              />
            </label>
            <label className="fld" style={{ margin: 0 }}>
              <span className="fl">Stock</span>
              <input
                inputMode="numeric"
                value={v.stockText}
                onChange={(e) => {
                  const next = [...variants];
                  next[idx] = { ...v, stockText: e.target.value };
                  setVariants(next);
                }}
              />
            </label>
          </div>
        ))}

        {note ? (
          <div className="note-panel" style={{ marginBottom: 10 }}>
            {note}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            className="btn ghost"
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(false);
              setNote("");
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
