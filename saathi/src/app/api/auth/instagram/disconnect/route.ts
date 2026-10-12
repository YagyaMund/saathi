import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { clearShopMetaToken } from "@/lib/meta/tokens";

export async function POST() {
  try {
    const session = await requireSession();
    await clearShopMetaToken(session.shopId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Disconnect failed" },
      { status: 400 },
    );
  }
}
