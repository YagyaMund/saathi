import { prisma } from "@/lib/db";

/**
 * Deterministic Sheet writer. When Google is connected we still persist a local
 * fixture row (stub). Real Sheets API plugs in here later.
 */
export async function writeSheetTab(
  shopId: string,
  tab: string,
  payload: Record<string, unknown>,
) {
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
  const row = await prisma.sheetRow.create({
    data: {
      shopId,
      tab,
      payload: JSON.stringify(payload),
    },
  });
  return {
    row,
    destination: shop.googleConnected ? "google_stub" : "local",
    spreadsheetId: shop.spreadsheetId,
  };
}

export async function listSheetRows(shopId: string, tab?: string) {
  return prisma.sheetRow.findMany({
    where: { shopId, ...(tab ? { tab } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
