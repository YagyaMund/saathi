import { InsightRetry } from "@/components/insight-retry";
import { Badge } from "@/components/ui/badge";
import { productInsight } from "@/lib/gemini";
import type { Product } from "@/lib/types";

export async function FloorNote({ product }: { product: Product }) {
  let failure = "";
  let insight = "";
  let source: "vertex-gemini" | "local" = "local";
  let model: string | undefined;
  try {
    const note = await productInsight(product);
    insight = note.insight;
    source = note.source;
    model = note.model;
  } catch (error) {
    failure = error instanceof Error ? error.message : "Gemini did not answer.";
  }

  if (failure) {
    return <InsightRetry slug={product.slug} initialError={failure} />;
  }

  return (
    <aside className="rounded-2xl bg-secondary/80 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-heading text-xl">Floor note</h2>
        <Badge variant="secondary">{source === "vertex-gemini" ? model || "Gemini" : "Local note"}</Badge>
      </div>
      <p className="mt-3 text-sm leading-7 text-foreground">{insight}</p>
    </aside>
  );
}
