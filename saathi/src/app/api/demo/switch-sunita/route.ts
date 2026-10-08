import { NextResponse } from "next/server";
import { createSession, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const session = await requireSession();
    const shop = await prisma.shop.findUnique({
      where: { slug: "sunita-handicrafts" },
    });
    if (!shop) throw new Error("Sunita demo not seeded");
    await prisma.shopMember.upsert({
      where: {
        shopId_userId: { shopId: shop.id, userId: session.userId },
      },
      create: { shopId: shop.id, userId: session.userId, role: "owner" },
      update: {},
    });
    await createSession({ ...session, shopId: shop.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Switch failed" },
      { status: 400 },
    );
  }
}
