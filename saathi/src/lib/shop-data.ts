import { prisma } from "@/lib/db";

export async function getShopBundle(shopId: string) {
  const shop = await prisma.shop.findUniqueOrThrow({
    where: { id: shopId },
    include: {
      analyticsSnap: true,
      unmetAsks: { orderBy: { count: "desc" } },
      eveningReports: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const [
    drafts,
    posts,
    items,
    conversations,
    orders,
    needsCount,
  ] = await Promise.all([
    prisma.draft.findMany({
      where: { shopId, status: { in: ["pending", "skipped"] } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.igPost.findMany({
      where: { shopId },
      orderBy: { postedAt: "desc" },
    }),
    prisma.item.findMany({
      where: { shopId },
      include: { variants: true },
      orderBy: { name: "asc" },
    }),
    prisma.conversation.findMany({
      where: { shopId },
      orderBy: [{ needsSeller: "desc" }, { lastAt: "desc" }],
    }),
    prisma.order.findMany({
      where: { shopId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.conversation.count({ where: { shopId, needsSeller: true } }),
  ]);

  const pendingDrafts = drafts.filter((d) => d.status === "pending");
  const readyCount = pendingDrafts.filter(
    (d) => d.priceInr && d.stock != null && JSON.parse(d.missing || "[]").length === 0,
  ).length;

  return {
    shop,
    drafts,
    pendingDrafts,
    posts,
    items,
    conversations,
    orders,
    needsCount,
    readyCount,
    agentFlags: JSON.parse(shop.agentFlags || "{}") as Record<string, boolean>,
  };
}

export async function getConversation(shopId: string, id: string) {
  return prisma.conversation.findFirst({
    where: { id, shopId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export const TONE: Record<string, string> = {
  pottery: "var(--t-pottery)",
  lac: "var(--t-lac)",
  block: "var(--t-block)",
  puppet: "var(--t-puppet)",
  brass: "var(--t-brass)",
};
