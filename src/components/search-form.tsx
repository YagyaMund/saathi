"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const suggestions = ["wool", "rain shell", "gift under 50", "lantern"];

export function SearchForm({ query }: { query: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState(query);

  function submit(value: string) {
    const next = value.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
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
    </div>
  );
}
