import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Chevron } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { getSession } from "@/lib/auth";
import { getShopBundle } from "@/lib/shop-data";

export default async function PostsPage() {
  const session = await getSession();
  const data = await getShopBundle(session!.shopId);

  return (
    <AppShell
      title="Your posts"
      sub="Simulated Instagram · never edited by Saathi"
      tab="posts"
      needsCount={data.needsCount}
    >
      <div
        style={{
          background: "var(--surface-2)",
          borderRadius: "var(--r)",
          padding: "11px 13px",
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.45,
        }}
      >
        Everything you post on Instagram shows up here. Saathi reads each one and
        drafts the items.
      </div>

      <div className="sec" style={{ marginTop: 16 }}>
        <div className="panel">
          {data.posts.map((p) => (
            <Link
              key={p.id}
              className="row"
              href={`/app/posts/${p.id}`}
              style={{ alignItems: "flex-start" }}
            >
              <Thumb tone={p.thumbTone} w={58} h={58} />
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)" }}>
                  {p.postedAt.toLocaleString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {p.photoCount} photos
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginTop: 3,
                    lineHeight: 1.35,
                  }}
                >
                  {p.caption.split("\n")[0]}
                </span>
                <span style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
                  {p.warnLabel ? (
                    <span className="chip warn">{p.warnLabel}</span>
                  ) : (
                    <span className="chip ok">{p.statusLabel}</span>
                  )}
                  {p.postType === "not_a_product" ? (
                    <span className="chip">Not a product</span>
                  ) : null}
                </span>
              </span>
              <span className="chev"><Chevron /></span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
