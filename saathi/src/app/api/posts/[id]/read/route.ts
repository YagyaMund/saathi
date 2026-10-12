import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { runPostReaderForPost } from "@/lib/agents/post-reader";

/** Run Post Reader (Vertex Gemini vision) on one Instagram post. */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const result = await runPostReaderForPost({
      shopId: session.shopId,
      postId: id,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Post Reader failed" },
      { status: 400 },
    );
  }
}
