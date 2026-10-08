import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildSharedContext } from "@/lib/prompts";
import { runAgentPrompt } from "@/lib/gemini";

export async function POST() {
  try {
    const session = await requireSession();
    const shop = await prisma.shop.findUniqueOrThrow({
      where: { id: session.shopId },
      include: {
        items: { include: { variants: true } },
        drafts: { where: { status: "pending" } },
        unmetAsks: true,
        analyticsSnap: true,
        orders: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });

    const catalogueXml = shop.items
      .map(
        (i) =>
          `<item id="${i.sku}" name="${i.name}" price="${i.priceInr}" floor_price="${i.floorInr}">` +
          i.variants
            .map(
              (v) =>
                `<variant sku="${v.sku}" label="${v.label}" stock="${v.stock}"/>`,
            )
            .join("") +
          `</item>`,
      )
      .join("\n");
    const pendingXml = shop.drafts
      .map((d) => `<draft name="${d.name}" missing='${d.missing}'/>`)
      .join("\n");

    const context = buildSharedContext(shop, catalogueXml, pendingXml);
    const result = await runAgentPrompt({
      agentSlug: "shop-analyst",
      sharedContext: context,
      userMessage: `Write tonight's evening report. Today orders=${shop.analyticsSnap?.todayOrders}, earned=${shop.analyticsSnap?.todayEarned}. Unmet: ${shop.unmetAsks.map((u) => `${u.label}:${u.count}`).join(", ")}`,
    });

    const report = await prisma.eveningReport.create({
      data: { shopId: shop.id, body: result.text },
    });

    return NextResponse.json({
      ok: true,
      mode: result.mode,
      report,
      tts: "stub",
      note: "TTS stub — wire Cloud Text-to-Speech later for Hindi/English voice note.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analyst failed" },
      { status: 400 },
    );
  }
}
