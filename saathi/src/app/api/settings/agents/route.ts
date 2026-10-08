import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const flags = body.flags as Record<string, boolean>;
    await prisma.shop.update({
      where: { id: session.shopId },
      data: { agentFlags: JSON.stringify(flags) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
