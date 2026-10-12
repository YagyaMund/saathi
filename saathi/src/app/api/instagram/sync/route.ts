import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInstagramChannel } from "@/lib/meta/channel";

export async function POST() {
  try {
    const session = await requireSession();
    const shop = await prisma.shop.findUniqueOrThrow({
      where: { id: session.shopId },
    });
    if (shop.instagramSim || !shop.metaTokenEnc) {
      return NextResponse.json(
        { error: "Connect Instagram first (not available in simulation mode)." },
        { status: 400 },
      );
    }
    const channel = getInstagramChannel(shop);
    const count = await channel.ingestMedia(40);
    return NextResponse.json({ ok: true, imported: count, mode: channel.mode });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 400 },
    );
  }
}
