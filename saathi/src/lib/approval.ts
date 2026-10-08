import { prisma } from "@/lib/db";

/**
 * CODE gate — nothing enters the catalogue without an Approval row.
 * Agents only produce drafts. This is the only write path to Item.
 */
export async function approveDraft(opts: {
  shopId: string;
  draftId: string;
  approvedBy: string;
  priceInr: number;
  stock: number;
  sizesText?: string | null;
}) {
  if (!opts.priceInr || opts.priceInr <= 0) {
    throw new Error("Price is required before approval");
  }
  if (opts.stock == null || opts.stock < 0) {
    throw new Error("Stock is required before approval");
  }

  return prisma.$transaction(async (tx) => {
    const draft = await tx.draft.findFirst({
      where: { id: opts.draftId, shopId: opts.shopId },
    });
    if (!draft) throw new Error("Draft not found");
    if (draft.status === "skipped") throw new Error("Skipped drafts cannot be approved");
    if (draft.status === "approved") throw new Error("Already approved");

    const existingApproval = await tx.approval.findUnique({
      where: { draftId: draft.id },
    });
    if (existingApproval) throw new Error("Approval already exists");

    const count = await tx.item.count({ where: { shopId: opts.shopId } });
    const sku = `P${String(count + 100).padStart(3, "0")}`;
    const floor = Math.round(opts.priceInr * 0.85);

    const variants =
      opts.sizesText && opts.sizesText.trim()
        ? opts.sizesText
            .split(/[,/]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((label, i) => ({
              sku: `${sku}-${i + 1}`,
              label,
              stock: Math.max(0, Math.floor(opts.stock / Math.max(1, opts.sizesText!.split(/[,/]/).filter(Boolean).length))),
            }))
        : [{ sku: `${sku}-STD`, label: "standard", stock: opts.stock }];

    // redistribute remainder onto first variant
    const assigned = variants.reduce((a, v) => a + v.stock, 0);
    if (variants[0] && assigned !== opts.stock) {
      variants[0].stock += opts.stock - assigned;
    }

    const item = await tx.item.create({
      data: {
        shopId: opts.shopId,
        sku,
        name: draft.name,
        category: draft.category,
        description: draft.description,
        attributes: draft.attributes,
        priceInr: opts.priceInr,
        floorInr: floor,
        thumbTone: draft.thumbTone,
        sourcePostId: draft.postId || undefined,
        approvedAt: new Date(),
        status: "live",
        variants: { create: variants },
      },
      include: { variants: true },
    });

    await tx.approval.create({
      data: {
        shopId: opts.shopId,
        draftId: draft.id,
        approvedBy: opts.approvedBy,
        priceInr: opts.priceInr,
        stockJson: JSON.stringify(variants),
      },
    });

    await tx.draft.update({
      where: { id: draft.id },
      data: {
        status: "approved",
        priceInr: opts.priceInr,
        stock: opts.stock,
        sizesText: opts.sizesText || draft.sizesText,
        missing: "[]",
      },
    });

    await tx.sheetRow.create({
      data: {
        shopId: opts.shopId,
        tab: "Products",
        payload: JSON.stringify({
          sku: item.sku,
          name: item.name,
          category: item.category,
          price_inr: item.priceInr,
          floor_inr: item.floorInr,
          variants,
          approved_at: new Date().toISOString(),
        }),
      },
    });

    return item;
  });
}

/** Variant stock decrement — arithmetic only, never an LLM. */
export async function decrementVariantStock(variantId: string, qty = 1) {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new Error("Variant not found");
    if (variant.stock < qty) throw new Error("Not enough stock");
    return tx.variant.update({
      where: { id: variantId },
      data: { stock: variant.stock - qty },
    });
  });
}

/** Floor check — hard gate between Negotiator suggestion and the buyer. */
export function assertAboveFloor(priceInr: number, floorInr: number) {
  if (priceInr < floorInr) {
    return { ok: false as const, reason: "below_floor" };
  }
  return { ok: true as const };
}
