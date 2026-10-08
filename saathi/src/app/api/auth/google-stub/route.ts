import { NextResponse } from "next/server";
import { createSession, stubGoogleSignIn } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.useDemoShop) {
      const shop = await prisma.shop.findUnique({
        where: { slug: "sunita-handicrafts" },
        include: { members: { include: { user: true }, take: 1 } },
      });
      if (!shop?.members[0]) throw new Error("Demo shop not seeded");
      const user = shop.members[0].user;
      await prisma.user.update({
        where: { id: user.id },
        data: { googleSub: user.googleSub || `stub-google-${user.email}` },
      });
      await prisma.shop.update({
        where: { id: shop.id },
        data: {
          googleConnected: true,
          googleEmail: body.email || shop.googleEmail || user.email,
        },
      });
      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        shopId: shop.id,
      });
      return NextResponse.json({ ok: true, stub: true });
    }
    await stubGoogleSignIn({
      email: String(body.email || ""),
      name: String(body.name || "Seller"),
      connectSheet: Boolean(body.connectSheet),
    });
    return NextResponse.json({ ok: true, stub: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Google stub failed" },
      { status: 400 },
    );
  }
}
