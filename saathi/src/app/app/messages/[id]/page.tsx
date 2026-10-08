import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth";
import { getConversation } from "@/lib/shop-data";
import { prisma } from "@/lib/db";
import { ThreadClient } from "./ui";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const conversation = await getConversation(session!.shopId, id);
  if (!conversation) notFound();
  const needsCount = await prisma.conversation.count({
    where: { shopId: session!.shopId, needsSeller: true },
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
        messages={conversation.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          body: m.body,
          kind: m.kind,
        }))}
      />
    </AppShell>
  );
}
