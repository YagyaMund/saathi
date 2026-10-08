import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { approveDraft } from "@/lib/approval";
import { parseInr } from "@/lib/money";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const drafts = Array.isArray(body.drafts) ? body.drafts : [];
    const approved = [];
    for (const d of drafts) {
      const price = typeof d.priceInr === "number" ? d.priceInr : parseInr(String(d.price || ""));
      const stock =
        typeof d.stock === "number" ? d.stock : Number(String(d.stock || "").replace(/\D/g, ""));
      if (!price || Number.isNaN(stock)) continue;
      const item = await approveDraft({
        shopId: session.shopId,
        draftId: String(d.draftId),
        approvedBy: session.userId,
        priceInr: price,
        stock,
        sizesText: d.sizesText || null,
      });
      approved.push(item.sku);
    }
    return NextResponse.json({ ok: true, approved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Approval failed" },
      { status: 400 },
    );
  }
}
