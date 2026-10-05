"use client";

import { StateMessage } from "@/components/state-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { money } from "@/lib/money";
import type { AssistantTurn } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

const prompts = [
  "What should I pack for a wet weekend?",
  "A gift under $50",
  "Something in wool",
];

type Cited = { slug: string; name: string; price: number; category: string };

type Reply = {
  reply: string;
  source: "vertex-gemini" | "local";
  model?: string;
  products: Cited[];
};

export function AssistantPanel() {
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [citations, setCitations] = useState<Record<number, Cited[]>>({});
  const [source, setSource] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function send(text: string, base: AssistantTurn[] = turns) {
    const content = text.trim();
    if (!content || status === "loading") return;
    const history: AssistantTurn[] = [...base, { role: "user", content }];
    setTurns(history);
    setDraft("");
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const body = (await response.json()) as Reply & { error?: string };
      if (!response.ok) {
        setError(body.error || "The associate is unavailable.");
        setStatus("error");
        return;
      }
      const next = [...history, { role: "assistant" as const, content: body.reply }];
      setTurns(next);
      setCitations((current) => ({ ...current, [next.length - 1]: body.products }));
      setSource(body.source === "vertex-gemini" ? body.model || "Gemini" : "Local catalog");
      setStatus("idle");
    } catch {
      setError("The associate never came back. Try again in a moment.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="outline"
            className="h-8"
            onClick={() => send(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>

      <div className="min-h-72 space-y-4 rounded-2xl border border-border bg-card/70 p-4 sm:p-6">
        {turns.length === 0 && status !== "loading" ? (
          <StateMessage
            title="Ask the associate."
            body="Answers stay inside the twelve-piece catalog. Gemini on Vertex AI takes over when GCP_PROJECT_ID is set; otherwise you get a local note grounded in the same products."
          />
        ) : null}

        {turns.map((turn, index) => (
          <div key={`${turn.role}-${index}`} className={turn.role === "user" ? "text-right" : ""}>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {turn.role === "user" ? "You" : "Associate"}
            </p>
            <p
              className={
                turn.role === "user"
                  ? "ml-auto mt-1 inline-block max-w-xl rounded-2xl bg-primary px-4 py-3 text-left text-sm leading-6 text-primary-foreground"
                  : "mt-1 max-w-xl text-sm leading-7"
              }
            >
              {turn.content}
            </p>
            {turn.role === "assistant" && (citations[index]?.length ?? 0) > 0 ? (
              <div className="mt-3 flex flex-col gap-2">
                {citations[index].map((product) => (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    className="max-w-xl rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-secondary"
                  >
                    <span className="font-medium">{product.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {product.category} · {money(product.price)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {status === "loading" ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Checking the floor…
          </p>
        ) : null}
      </div>

      {status === "error" ? (
        <StateMessage
          title="The associate didn't answer."
          body={error}
          action={{
            label: "Retry",
            onClick: () => {
              const last = turns[turns.length - 1];
              if (!last || last.role !== "user") return;
              void send(last.content, turns.slice(0, -1));
            },
          }}
        />
      ) : null}

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <label className="sr-only" htmlFor="assistant-message">
          Message the associate
        </label>
        <Textarea
          id="assistant-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="A wet weekend on the coast, two nights."
          className="min-h-24 text-base"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {source ? <Badge variant="secondary">{source}</Badge> : <span />}
          <Button type="submit" className="h-10 px-4" disabled={status === "loading" || !draft.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
