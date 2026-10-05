"use client";

import { ProductCard } from "@/components/product-card";
import { StateMessage } from "@/components/state-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/types";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const suggestions = ["wool", "rain shell", "gift under 50", "lantern"];

type SearchResponse = {
  source?: "discovery-engine" | "local";
  results?: Array<{ product: Product; snippet: string }>;
  error?: string;
};

export function SearchPanel({ query }: { query: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  function submit(value: string) {
    const next = value.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <div className="space-y-8">
      <SearchForm key={query} query={query} onSubmit={submit} />
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant="outline"
            className="h-8"
            onClick={() => submit(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
      <SearchResults
        key={`${query}:${attempt}`}
        query={query}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    </div>
  );
}

function SearchForm({
  query,
  onSubmit,
}: {
  query: string;
  onSubmit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(query);

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <label className="sr-only" htmlFor="catalog-search">
        Search the catalog
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="catalog-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Wool, rain, a weekend bag"
          className="h-11 pl-9 text-base"
        />
      </div>
      <Button type="submit" className="h-11 px-5">
        Search the floor
      </Button>
    </form>
  );
}

function SearchResults({ query, onRetry }: { query: string; onRetry: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    query.trim() ? "loading" : "idle",
  );
  const [payload, setPayload] = useState<SearchResponse>({});

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as SearchResponse;
        if (!response.ok) {
          setPayload({ error: body.error || "Search failed." });
          setStatus("error");
          return;
        }
        setPayload(body);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPayload({ error: "Search never came back. Check the connection and try again." });
        setStatus("error");
      });
    return () => controller.abort();
  }, [query]);

  if (status === "idle") {
    return (
      <StateMessage
        title="Ask for something specific."
        body="Vertex AI Search answers here when a data store is configured. Until then, the local catalog matches names, materials, and tags."
      />
    );
  }

  if (status === "loading") {
    return (
      <div className="space-y-4" aria-live="polite">
        <p className="text-sm text-muted-foreground">Looking through the catalog…</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <StateMessage
        title="Search didn't answer."
        body={payload.error || "Something went wrong."}
        action={{ label: "Try again", onClick: onRetry }}
      />
    );
  }

  if ((payload.results?.length ?? 0) === 0) {
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
          {payload.results?.length} {payload.results?.length === 1 ? "piece" : "pieces"} for “{query}”
        </span>
        <Badge variant="secondary">
          {payload.source === "discovery-engine" ? "Vertex AI Search" : "Local catalog"}
        </Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {payload.results?.map((hit) => (
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
