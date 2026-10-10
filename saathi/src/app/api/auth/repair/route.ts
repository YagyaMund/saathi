import { NextResponse } from "next/server";
import { clearSession, createSession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Repair stale shopId cookies (RSC cannot set cookies — Next.js 15). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/app";
  const dest = new URL(next.startsWith("/") ? next : "/app", url.origin);

  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const shop = await prisma.shop.findUnique({
    where: { id: session.shopId },
    select: { id: true },
  });
  if (shop) {
    return NextResponse.redirect(dest);
  }

  const membership = await prisma.shopMember.findFirst({
    where: { userId: session.userId },
    orderBy: { id: "asc" },
  });
  if (!membership) {
    await clearSession();
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  await createSession({ ...session, shopId: membership.shopId });
  return NextResponse.redirect(dest);
}
