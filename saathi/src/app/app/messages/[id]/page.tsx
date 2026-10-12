import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireShopSession } from "@/lib/auth";
import { getConversation } from "@/lib/shop-data";
import { prisma } from "@/lib/db";
import { ThreadClient } from "./ui";

type ThreadMsg = {
  id: string;
  sender: string;
  body: string;
  kind: string;
};

/** Hide legacy "I'll tell them: …" echoes that duplicated the seller line. */
function dedupeEchoMessages(messages: ThreadMsg[]): ThreadMsg[] {
  const out: ThreadMsg[] = [];
  for (const m of messages) {
    if (m.sender === "saathi") {
      const prev = out[out.length - 1];
      if (prev?.sender === "seller") {
        const b = m.body.trim();
        const t = prev.body.trim();
        if (
          b === t ||
          b === `I'll tell them: ${t}` ||
          b === `Sent on Instagram: ${t}`
        ) {
          continue;
        }
      }
    }
    out.push(m);
  }
  return out;
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireShopSession();
  const { id } = await params;
  const conversation = await getConversation(session.shopId, id);
  if (!conversation) notFound();
  const needsCount = await prisma.conversation.count({
    where: { shopId: session.shopId, needsSeller: true },
  });

  return (
    <AppShell
      title={conversation.buyerName}
      sub={
        conversation.windowHoursLeft != null
          ? `Bought before · ${conversation.windowHoursLeft}h left to reply`
          : "Instagram DM"
      }
      tab="messages"
      backHref="/app/messages"
      needsCount={needsCount}
    >
      <ThreadClient
        conversationId={conversation.id}
        needsSeller={conversation.needsSeller}
        messages={dedupeEchoMessages(
          conversation.messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            body: m.body,
            kind: m.kind,
          })),
        )}
      />
    </AppShell>
  );
}
