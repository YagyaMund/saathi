import { prisma } from "@/lib/db";
import { buildSharedContext } from "@/lib/prompts";
import { runAgentPromptWithImageUrls } from "@/lib/llm";

/**
 * Post Reader — Vertex Gemini multimodal reads post images + caption.
 * Understanding only (vision). Does not use Imagen (image generation).
 */
export async function runPostReaderForPost(opts: {
  shopId: string;
  postId: string;
}) {
  const shop = await prisma.shop.findUniqueOrThrow({
    where: { id: opts.shopId },
    include: {
      items: { include: { variants: true }, take: 40 },
      drafts: { where: { status: "pending" }, take: 20 },
    },
  });
  const post = await prisma.igPost.findFirst({
    where: { id: opts.postId, shopId: opts.shopId },
  });
  if (!post) throw new Error("Post not found");

  const catalogueXml = shop.items
    .map(
      (i) =>
        `<item id="${i.sku}" name="${i.name}" price="${i.priceInr}">` +
        i.variants
          .map((v) => `<variant sku="${v.sku}" label="${v.label}" stock="${v.stock}"/>`)
          .join("") +
        `</item>`,
    )
    .join("\n");
  const pendingXml = shop.drafts
    .map((d) => `<draft name="${d.name}" missing='${d.missing}'/>`)
    .join("\n");

  const imageUrls = post.mediaUrl ? [post.mediaUrl] : [];
  const userMessage = [
    "Read this Instagram post and draft catalogue listings (JSON only).",
    `permalink: ${post.permalink}`,
    `posted_at: ${post.postedAt.toISOString()}`,
    `caption:\n${post.caption}`,
    imageUrls.length
      ? `${imageUrls.length} image(s) attached — describe only what you see; do not invent materials.`
      : "No image URL on this post — use caption only; mark visual fields null.",
  ].join("\n\n");

  const result = await runAgentPromptWithImageUrls({
    agentSlug: "post-reader",
    sharedContext: buildSharedContext(shop, catalogueXml, pendingXml),
    userMessage,
    imageUrls,
  });

  return {
    postId: post.id,
    mode: result.mode,
    imageCount: result.imageCount,
    text: result.text,
  };
}
