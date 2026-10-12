import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInstagramChannel } from "@/lib/meta/channel";

/** True when a Saathi bubble is just an echo of the seller's line. */
function isEchoOf(sellerText: string, saathiBody: string) {
  const t = sellerText.trim();
  const b = saathiBody.trim();
  if (!t || !b) return false;
  if (b === t) return true;
  const prefixes = ["I'll tell them:", "I'll tell them: ", "Sent on Instagram:", "Sent on Instagram: "];
  for (const p of prefixes) {
    if (b.startsWith(p) && b.slice(p.length).trim() === t) return true;
  }
  return false;
}

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

    const shop = await prisma.shop.findUniqueOrThrow({
      where: { id: session.shopId },
    });
    const channel = getInstagramChannel(shop);

    let externalId: string | null = null;
    if (channel.mode === "meta" && conversation.buyerIgsid) {
      externalId = await channel.sendDm(conversation.buyerIgsid, text);
    }

    // One bubble only — seller's answer. No "I'll tell them: …" echo.
    await prisma.message.create({
      data: {
        conversationId: id,
        sender: "seller",
        body: text,
        externalId,
      },
    });

    // Clean any prior echo duplicates already in this thread.
    const prior = await prisma.message.findMany({
      where: { conversationId: id, sender: "saathi" },
      select: { id: true, body: true },
    });
    const echoIds = prior
      .filter((m) => isEchoOf(text, m.body))
      .map((m) => m.id);
    if (echoIds.length) {
      await prisma.message.deleteMany({ where: { id: { in: echoIds } } });
    }

    await prisma.conversation.update({
      where: { id },
      data: {
        needsSeller: false,
        handledBySaathi: true,
        chip: channel.mode === "meta" ? "Sent" : "You answered",
        chipTone: "ok",
        lastPreview: text,
        lastAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, channel: channel.mode });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reply failed" },
      { status: 400 },
    );
  }
}
