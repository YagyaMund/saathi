import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Stub Google Sheet connect until real OAuth client credentials exist. */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const connect = body.connect !== false;
    await prisma.shop.update({
      where: { id: session.shopId },
      data: {
        googleConnected: connect,
        googleEmail: connect
          ? body.email || session.email
          : null,
        spreadsheetId: connect
          ? `local-${session.shopId.slice(0, 8)}`
          : null,
      },
    });
    return NextResponse.json({
      ok: true,
      stub: true,
      message: connect
        ? "Google Sheet connected (stub). Real OAuth plugs in when client credentials are set."
        : "Google disconnected",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Connect failed" },
      { status: 400 },
    );
  }
}
