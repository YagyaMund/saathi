import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireShopSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Thumb } from "@/components/thumb";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireShopSession();
  const { id } = await params;
  const post = await prisma.igPost.findFirst({
    where: { id, shopId: session.shopId },
    include: { drafts: true },
  });
  if (!post) notFound();
  const reviews = JSON.parse(post.reviewJson || "[]") as {
    tone: string;
    title: string;
    body: string;
  }[];
  const needsCount = await prisma.conversation.count({
    where: { shopId: session.shopId, needsSeller: true },
  });

  return (
    <AppShell
      title="Post review"
      sub="Suggestions only — Saathi never edits Instagram"
      tab="posts"
      backHref="/app/posts"
      needsCount={needsCount}
    >
      <div style={{ display: "flex", gap: 13 }}>
        <div style={{ flex: "0 0 auto", width: 92 }}>
          <div
            style={{
              width: 92,
              height: 115,
              borderRadius: 9,
              background: "#6C7B92",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 26,
                background: "#485363",
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 6, textAlign: "center" }}>
            Photo 4 of {post.photoCount}
          </div>
        </div>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <span className="chip warn">Will cost you sales</span>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 9, lineHeight: 1.4 }}>
            This photo is dark and the cobalt glaze looks grey.
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>
            Shoot near a window in the morning, on a plain white cloth.
          </div>
          <button className="btn ghost" style={{ marginTop: 11, height: 42, fontSize: 13.5 }}>
            Let Saathi brighten it
          </button>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><span className="sec-t">Your caption</span></div>
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: "var(--r)",
            padding: "13px 14px",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--ink-2)",
            whiteSpace: "pre-wrap",
          }}
        >
          {post.caption}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 15 }}>
          {reviews.map((r) => (
            <div key={r.title} style={{ display: "flex", gap: 11 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  background: r.tone === "ok" ? "var(--accent)" : "var(--warn)",
                  flex: "0 0 auto",
                  marginTop: 6,
                }}
              />
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                  {r.title}
                </span>
                <span style={{ display: "block", fontSize: 13, color: "var(--ink-2)", marginTop: 3, lineHeight: 1.5 }}>
                  {r.body}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <span className="sec-t">Items from this post</span>
          <Link className="link" href="/app/approvals">Approve</Link>
        </div>
        <div className="panel">
          {post.drafts.map((d) => (
            <div className="row" key={d.id}>
              <Thumb tone={d.thumbTone} w={34} h={42} />
              <span style={{ flex: "1 1 auto", fontSize: 13.5, fontWeight: 500 }}>{d.name}</span>
              {d.priceInr ? (
                <span className="chip">₹{d.priceInr}</span>
              ) : (
                <span className="chip warn">No price</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
