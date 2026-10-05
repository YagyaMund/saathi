"use client";

import { StateMessage } from "@/components/state-message";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

type InsightResponse = {
  insight?: string;
  source?: "vertex-gemini" | "local";
  model?: string;
  error?: string;
};

export function InsightRetry({ slug, initialError }: { slug: string; initialError: string }) {
  const [status, setStatus] = useState<"error" | "loading" | "ready">("error");
  const [payload, setPayload] = useState<InsightResponse>({ error: initialError });

  async function retry() {
    setStatus("loading");
    try {
      const response = await fetch(`/api/products/${slug}/insight`);
      const body = (await response.json()) as InsightResponse;
      if (!response.ok) {
        setPayload({ error: body.error || "Gemini did not answer." });
        setStatus("error");
        return;
      }
      setPayload(body);
      setStatus("ready");
    } catch {
      setPayload({ error: "The floor note never came back." });
      setStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <div className="space-y-3 rounded-2xl bg-secondary/70 p-5" aria-live="polite">
        <p className="text-sm text-muted-foreground">Writing a floor note…</p>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <StateMessage
        title="No floor note yet."
        body={payload.error || "Gemini did not answer."}
        action={{ label: "Retry", onClick: () => void retry() }}
      />
    );
  }

  return (
    <aside className="rounded-2xl bg-secondary/80 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-heading text-xl">Floor note</h2>
        <Badge variant="secondary">
          {payload.source === "vertex-gemini" ? payload.model || "Gemini" : "Local note"}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-7 text-foreground">{payload.insight}</p>
    </aside>
  );
}
