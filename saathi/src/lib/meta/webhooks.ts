import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { metaAppSecret } from "@/lib/meta/config";

export function verifyMetaSignature(rawBody: string, header: string | null): boolean {
  const secret = metaAppSecret();
  if (!secret) return false;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const given = header.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(given, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function claimEvent(eventKey: string, kind: string): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({ data: { eventKey, kind } });
    return true;
  } catch {
    return false; // unique violation = duplicate
  }
}

function hoursLeftFrom(openedAt: Date): number {
  const end = openedAt.getTime() + 24 * 60 * 60 * 1000;
  return Math.max(0, (end - Date.now()) / (60 * 60 * 1000));
}

type CommentChange = {
  field?: string;
  value?: {
    id?: string;
    comment_id?: string;
    text?: string;
    from?: { id?: string; username?: string };
    media?: { id?: string };
  };
};

export async function handleInstagramWebhookPayload(body: {
  object?: string;
  entry?: {
    id?: string;
    time?: number;
    changes?: CommentChange[];
    messaging?: {
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: { mid?: string; text?: string; is_echo?: boolean };
    }[];
  }[];
}): Promise<{ comments: number; messages: number }> {
  let comments = 0;
  let messages = 0;
  if (body.object !== "instagram") return { comments, messages };

  for (const entry of body.entry || []) {
    const igUserId = entry.id ? String(entry.id) : "";
    const shop = igUserId
      ? await prisma.shop.findFirst({ where: { igUserId } })
      : null;

    for (const change of entry.changes || []) {
      if (change.field !== "comments" && change.field !== "live_comments") continue;
      const v = change.value || {};
      const commentId = String(v.comment_id || v.id || "");
      if (!commentId || !shop) continue;
      if (!(await claimEvent(`comment:${commentId}`, "comment"))) continue;

      const mediaId = v.media?.id ? String(v.media.id) : "";
      let post = mediaId
        ? await prisma.igPost.findFirst({
            where: { shopId: shop.id, externalId: mediaId },
          })
        : null;
      if (!post && mediaId) {
        post = await prisma.igPost.create({
          data: {
            shopId: shop.id,
            externalId: mediaId,
            permalink: `https://www.instagram.com/p/${mediaId}/`,
            caption: "",
            postedAt: new Date(),
            statusLabel: "From comment webhook",
          },
        });
      }
      if (!post) continue;

      await prisma.igComment.upsert({
        where: { externalId: commentId },
        create: {
          postId: post.id,
          externalId: commentId,
          author: v.from?.username || "buyer",
          authorIgsid: v.from?.id || null,
          body: v.text || "",
        },
        update: {
          body: v.text || "",
          author: v.from?.username || undefined,
          authorIgsid: v.from?.id || undefined,
        },
      });
      comments += 1;
    }

    for (const msg of entry.messaging || []) {
      if (!shop || msg.message?.is_echo) continue;
      const mid = msg.message?.mid;
      const text = msg.message?.text || "";
      const senderId = msg.sender?.id;
      if (!mid || !senderId || !text) continue;
      if (!(await claimEvent(`msg:${mid}`, "message"))) continue;

      const openedAt = msg.timestamp
        ? new Date(msg.timestamp)
        : new Date();

      let conversation = await prisma.conversation.findFirst({
        where: { shopId: shop.id, buyerIgsid: senderId },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            shopId: shop.id,
            buyerName: "Instagram buyer",
            buyerIgsid: senderId,
            channel: "dm",
            needsSeller: true,
            chip: "New message",
            chipTone: "warn",
            lastPreview: text.slice(0, 120),
            lastAt: openedAt,
            windowOpenedAt: openedAt,
            windowHoursLeft: hoursLeftFrom(openedAt),
          },
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            needsSeller: true,
            chip: "Needs you",
            chipTone: "warn",
            lastPreview: text.slice(0, 120),
            lastAt: openedAt,
            windowOpenedAt: openedAt,
            windowHoursLeft: hoursLeftFrom(openedAt),
            handledBySaathi: false,
          },
        });
      }

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: "buyer",
          body: text,
          externalId: mid,
        },
      });
      messages += 1;
    }
  }

  return { comments, messages };
}
