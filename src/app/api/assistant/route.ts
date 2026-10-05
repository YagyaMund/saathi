import { listProducts } from "@/lib/catalog";
import { assist } from "@/lib/gemini";
import type { AssistantTurn } from "@/lib/types";
import { NextResponse } from "next/server";

function isTurn(value: unknown): value is AssistantTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as AssistantTurn;
  return (
    (turn.role === "user" || turn.role === "assistant") &&
    typeof turn.content === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || !messages.every(isTurn)) {
    return NextResponse.json(
      { error: "messages must be a list of user and assistant turns." },
      { status: 400 },
    );
  }
  const latest = [...messages].reverse().find((turn) => turn.role === "user");
  if (!latest?.content.trim()) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }

  try {
    const { products } = await listProducts();
    const result = await assist(messages.slice(-8), products);
    return NextResponse.json({
      reply: result.reply,
      source: result.source,
      model: result.model,
      products: result.products.map((product) => ({
        slug: product.slug,
        name: product.name,
        price: product.price,
        category: product.category,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The associate is unavailable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
