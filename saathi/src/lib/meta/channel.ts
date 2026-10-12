import type { Shop } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  fetchIgMedia,
  hideComment,
  replyToCommentPublic,
  sendDirectMessage,
  sendPrivateReply,
} from "@/lib/meta/graph";
import { getValidAccessToken, shopHasMetaToken } from "@/lib/meta/tokens";

export type InstagramChannel = {
  mode: "meta" | "sim";
  ingestMedia: (limit?: number) => Promise<number>;
  replyPublic: (commentExternalId: string, text: string) => Promise<void>;
  privateReply: (commentExternalId: string, text: string) => Promise<void>;
  hideComment: (commentExternalId: string) => Promise<void>;
  sendDm: (recipientIgsid: string, text: string) => Promise<string | null>;
};

function toneFromCaption(caption: string): string {
  const c = caption.toLowerCase();
  if (c.includes("bangle") || c.includes("lac")) return "bangle";
  if (c.includes("textile") || c.includes("block") || c.includes("cushion"))
    return "textile";
  if (c.includes("puppet")) return "puppet";
  return "pottery";
}

async function upsertMediaForShop(shop: Shop, accessToken: string, limit = 25) {
  const media = await fetchIgMedia(accessToken, limit);
  let n = 0;
  for (const m of media) {
    const children = m.children?.data?.length || 0;
    const photoCount =
      m.media_type === "CAROUSEL_ALBUM" ? Math.max(children, 1) : 1;
    await prisma.igPost.upsert({
      where: {
        shopId_externalId: { shopId: shop.id, externalId: m.id },
      },
      create: {
        shopId: shop.id,
        externalId: m.id,
        permalink: m.permalink || `https://www.instagram.com/p/${m.id}/`,
        caption: m.caption || "",
        postedAt: m.timestamp ? new Date(m.timestamp) : new Date(),
        photoCount,
        mediaUrl: m.media_url || null,
        thumbTone: toneFromCaption(m.caption || ""),
        postType: "product",
        statusLabel: "Imported from Instagram",
      },
      update: {
        permalink: m.permalink || undefined,
        caption: m.caption || "",
        postedAt: m.timestamp ? new Date(m.timestamp) : undefined,
        photoCount,
        mediaUrl: m.media_url || null,
      },
    });
    n += 1;
  }
  return n;
}

class MetaChannel implements InstagramChannel {
  mode = "meta" as const;
  constructor(private shop: Shop) {}

  private async token() {
    const t = await getValidAccessToken(this.shop);
    if (!t || !this.shop.igUserId) throw new Error("Instagram not connected");
    return t;
  }

  async ingestMedia(limit = 25) {
    const token = await this.token();
    return upsertMediaForShop(this.shop, token, limit);
  }

  async replyPublic(commentExternalId: string, text: string) {
    await replyToCommentPublic(await this.token(), commentExternalId, text);
  }

  async privateReply(commentExternalId: string, text: string) {
    await sendPrivateReply(
      await this.token(),
      this.shop.igUserId!,
      commentExternalId,
      text,
    );
  }

  async hideComment(commentExternalId: string) {
    await hideComment(await this.token(), commentExternalId, true);
  }

  async sendDm(recipientIgsid: string, text: string) {
    const res = await sendDirectMessage(
      await this.token(),
      this.shop.igUserId!,
      recipientIgsid,
      text,
    );
    return res.message_id || null;
  }
}

class SimChannel implements InstagramChannel {
  mode = "sim" as const;
  constructor(private shop: Shop) {}

  async ingestMedia() {
    return 0;
  }

  async replyPublic() {
    /* local-only */
  }

  async privateReply() {
    /* local-only */
  }

  async hideComment() {
    /* local-only */
  }

  async sendDm() {
    return null;
  }
}

export function getInstagramChannel(shop: Shop): InstagramChannel {
  if (!shop.instagramSim && shopHasMetaToken(shop)) {
    return new MetaChannel(shop);
  }
  return new SimChannel(shop);
}
