import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "saathi_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/app")) return NextResponse.next();
  if (req.cookies.get(COOKIE)?.value) return NextResponse.next();
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/app/:path*"],
};
