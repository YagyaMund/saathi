import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeSheetTab } from "@/lib/sheet";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      category?: string;
      priceInr?: number;
      floorInr?: number;
      attributes?: Record<string, string>;
      status?: string;
      variants?: { id: string; stock: number; label?: string }[];
    };

    const existing = await prisma.item.findFirst({
      where: { id, shopId: session.shopId },
      include: { variants: true },
    });
    if (!existing) throw new Error("Item not found");

    const name = String(body.name ?? existing.name).trim();
    if (!name) throw new Error("Name is required");
    const priceInr = Number(body.priceInr ?? existing.priceInr);
    const floorInr = Number(body.floorInr ?? existing.floorInr);
    if (!Number.isFinite(priceInr) || priceInr <= 0) {
      throw new Error("Price must be a positive number");
    }
    if (!Number.isFinite(floorInr) || floorInr < 0) {
      throw new Error("Floor price is invalid");
    }
    if (floorInr > priceInr) {
      throw new Error("Floor cannot be above selling price");
    }

    const attrs =
      body.attributes && typeof body.attributes === "object"
        ? body.attributes
        : (JSON.parse(existing.attributes || "{}") as Record<string, string>);

    const item = await prisma.$transaction(async (tx) => {
      if (Array.isArray(body.variants)) {
        for (const v of body.variants) {
          const stock = Math.max(0, Math.floor(Number(v.stock)));
          if (!Number.isFinite(stock)) continue;
          const owned = existing.variants.find((x) => x.id === v.id);
          if (!owned) continue;
          await tx.variant.update({
            where: { id: v.id },
            data: {
              stock,
              ...(v.label?.trim() ? { label: v.label.trim() } : {}),
            },
          });
        }
      }

      const totalStock = (
        await tx.variant.findMany({ where: { itemId: id } })
      ).reduce((a, v) => a + v.stock, 0);

      return tx.item.update({
        where: { id },
        data: {
          name,
          description: String(body.description ?? existing.description),
          category: String(body.category ?? existing.category).trim() || existing.category,
          priceInr,
          floorInr,
          attributes: JSON.stringify(attrs),
          status:
            body.status === "sold_out" || totalStock === 0
              ? "sold_out"
              : body.status === "live" || totalStock > 0
                ? "live"
                : existing.status,
        },
        include: { variants: true },
      });
    });

    await writeSheetTab(session.shopId, "Products", {
      action: "update",
      sku: item.sku,
      name: item.name,
      category: item.category,
      description: item.description,
      price_inr: item.priceInr,
      floor_inr: item.floorInr,
      attributes: JSON.parse(item.attributes || "{}"),
      status: item.status,
      variants: item.variants.map((v) => ({
        sku: v.sku,
        label: v.label,
        stock: v.stock,
      })),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
