import { NextResponse } from "next/server";
import {
  getSession,
  sessionCookieOptions,
  SESSION_COOKIE,
  signSessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Repair stale shopId cookies (must set cookie on the redirect response). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/app";
  const safeNext = next.startsWith("/") ? next : "/app";
  const dest = new URL(safeNext, url.origin);
  const login = new URL("/login", url.origin);

  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(login);
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
    const res = NextResponse.redirect(login);
    res.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    return res;
  }

  const repaired = { ...session, shopId: membership.shopId };
  const token = await signSessionToken(repaired);
  const res = NextResponse.redirect(dest);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
