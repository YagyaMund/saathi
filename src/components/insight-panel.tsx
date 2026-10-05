"use client";

import { StateMessage } from "@/components/state-message";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

type InsightResponse = {
  insight?: string;
  source?: "vertex-gemini" | "local";
  model?: string;
  error?: string;
};

export function InsightPanel({ slug }: { slug: string }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <InsightRequest
      key={`${slug}:${attempt}`}
      slug={slug}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  );
}

function InsightRequest({ slug, onRetry }: { slug: string; onRetry: () => void }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [payload, setPayload] = useState<InsightResponse>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/${slug}/insight`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as InsightResponse;
        if (!response.ok) {
          setPayload({ error: body.error || "Gemini did not answer." });
          setStatus("error");
          return;
        }
        setPayload(body);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPayload({ error: "The floor note never came back." });
        setStatus("error");
      });
    return () => controller.abort();
  }, [slug]);

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
        action={{ label: "Retry", onClick: onRetry }}
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
