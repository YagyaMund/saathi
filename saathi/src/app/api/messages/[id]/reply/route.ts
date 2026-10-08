import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = await req.json();
    const text = String(body.text || "").trim();
    if (!text) throw new Error("Answer required");

    const conversation = await prisma.conversation.findFirst({
      where: { id, shopId: session.shopId },
    });
    if (!conversation) throw new Error("Thread not found");

    await prisma.message.create({
      data: {
        conversationId: id,
        sender: "seller",
        body: text,
      },
    });
    await prisma.message.create({
      data: {
        conversationId: id,
        sender: "saathi",
        body: `I'll tell them: ${text}`,
      },
    });
    await prisma.conversation.update({
      where: { id },
      data: {
        needsSeller: false,
        handledBySaathi: true,
        chip: "You answered",
        chipTone: "ok",
        lastPreview: text,
        lastAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reply failed" },
      { status: 400 },
    );
  }
}
