import { ProductCard } from "@/components/product-card";
import { StateMessage } from "@/components/state-message";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listProducts } from "@/lib/catalog";
import { searchProducts } from "@/lib/discovery";
import type { SearchHit } from "@/lib/types";
import Link from "next/link";

export async function SearchResults({ query }: { query: string }) {
  if (!query.trim()) {
    return (
      <StateMessage
        title="Ask for something specific."
        body="Vertex AI Search answers here when a data store is configured. Until then, the local catalog matches names, materials, and tags."
      />
    );
  }

  let failure = "";
  let source: "discovery-engine" | "local" = "local";
  let results: SearchHit[] = [];
  try {
    const { products } = await listProducts();
    const found = await searchProducts(query, products);
    source = found.source;
    results = found.results;
  } catch (error) {
    failure = error instanceof Error ? error.message : "Search failed.";
  }

  if (failure) {
    return (
      <div className="space-y-4">
        <StateMessage title="Search didn't answer." body={failure} />
        <Link
          href={`/search?q=${encodeURIComponent(query)}`}
          className={cn(buttonVariants(), "h-10 px-4")}
        >
          Try again
        </Link>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <StateMessage
        title="Nothing matched."
        body="The floor is twelve pieces. Try wool, rain, or lantern."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {results.length} {results.length === 1 ? "piece" : "pieces"} for “{query}”
        </span>
        <Badge variant="secondary">
          {source === "discovery-engine" ? "Vertex AI Search" : "Local catalog"}
        </Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((hit) => (
          <div key={hit.product.id} className="space-y-2">
            <ProductCard product={hit.product} />
            {hit.snippet && hit.snippet !== hit.product.summary ? (
              <p className="px-1 text-sm leading-6 text-muted-foreground">{hit.snippet}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
