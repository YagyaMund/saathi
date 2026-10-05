import { geminiEnabled, runtimeConfig } from "@/lib/config";
import { gcpFetch, readError } from "@/lib/gcp";
import { searchCatalog } from "@/lib/search";
import type { AssistantTurn, Product } from "@/lib/types";

function catalogBrief(products: Product[]): string {
  return products
    .map(
      (product) =>
        `${product.name} | ${product.category} | $${product.price} | ${product.materials} | ${product.weightGrams}g | ${product.summary}`,
    )
    .join("\n");
}

async function generate(prompt: string): Promise<{ text: string; model: string }> {
  const config = runtimeConfig();
  const url = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.region}/publishers/google/models/${config.vertexModel}:generateContent`;
  const response = await gcpFetch(url, config.projectId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 320 },
    }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return { text, model: config.vertexModel };
}

export async function productInsight(product: Product): Promise<{
  insight: string;
  source: "vertex-gemini" | "local";
  model?: string;
}> {
  if (!geminiEnabled()) {
    return { insight: product.localInsight, source: "local" };
  }
  const prompt = [
    "You write merchandising notes for Cove Supply, a twelve-piece coast-and-trail shop in Portland.",
    "Write two sentences for a floor associate. Say who the piece is for and one concrete detail that is already in the record.",
    "Do not invent features, materials, weights, or prices. No hashtags. No markdown.",
    "",
    JSON.stringify({
      name: product.name,
      category: product.category,
      price: product.price,
      materials: product.materials,
      weightGrams: product.weightGrams,
      origin: product.origin,
      summary: product.summary,
      description: product.description,
    }),
  ].join("\n");
  const { text, model } = await generate(prompt);
  return { insight: text, source: "vertex-gemini", model };
}

export function localAssistant(
  message: string,
  products: Product[],
): { reply: string; products: Product[] } {
  const query = message.toLowerCase();
  let pool = products;

  const under = query.match(/under\s+\$?\s*(\d+)/);
  if (under) {
    const max = Number(under[1]);
    pool = pool.filter((product) => product.price <= max);
  }
  if (/\brain|wet|storm|shell\b/.test(query)) {
    pool = pool.filter((product) =>
      /rain|waxed|shell|wool|lantern/.test(
        `${product.tags.join(" ")} ${product.name} ${product.materials}`.toLowerCase(),
      ),
    );
  } else if (/\bwool|merino\b/.test(query)) {
    pool = pool.filter(
      (product) =>
        product.tags.includes("wool") || /merino|wool/i.test(product.materials),
    );
  } else if (/\bgift\b/.test(query)) {
    pool = pool.filter((product) => product.tags.includes("gift") || product.price <= 60);
  } else if (/\bweekend|pack|bag|trip\b/.test(query)) {
    const preferred = pool.filter((product) =>
      /bag|weekend|wool|rain|shell/.test(
        `${product.name} ${product.tags.join(" ")}`.toLowerCase(),
      ),
    );
    if (preferred.length > 0) pool = preferred;
  }

  if (pool.length === products.length) {
    const hits = searchCatalog(message, products);
    pool = hits.map((hit) => hit.product);
  }

  const picks = pool.slice(0, 3);
  if (picks.length === 0) {
    return {
      reply:
        "Nothing on the floor matches that. Cove keeps twelve pieces — try wool, a rain shell, or a gift under $50.",
      products: [],
    };
  }

  const lead = under
    ? `Under $${under[1]}, I would start with the ${picks[0].name}.`
    : /\brain|wet|storm\b/.test(query)
      ? `For wet weather, start with the ${picks[0].name}.`
      : `I would start with the ${picks[0].name}.`;

  const detail = picks
    .map((product) => `${product.name} is $${product.price} — ${product.summary}`)
    .join(" ");

  return { reply: `${lead} ${detail}`, products: picks };
}

export async function assist(
  messages: AssistantTurn[],
  products: Product[],
): Promise<{ reply: string; products: Product[]; source: "vertex-gemini" | "local"; model?: string }> {
  const latest = [...messages].reverse().find((turn) => turn.role === "user");
  if (!latest?.content.trim()) {
    throw new Error("Ask a question first.");
  }

  if (!geminiEnabled()) {
    const local = localAssistant(latest.content, products);
    return { ...local, source: "local" };
  }

  const history = messages
    .slice(-8)
    .map((turn) => `${turn.role === "user" ? "Shopper" : "Associate"}: ${turn.content}`)
    .join("\n");
  const prompt = [
    "You are the floor associate at Cove Supply in Portland.",
    "Recommend only products from the catalog below. Mention names and prices.",
    "If nothing fits, say so. Stay under 120 words. No markdown headings.",
    "",
    "Catalog:",
    catalogBrief(products),
    "",
    history,
  ].join("\n");
  const { text, model } = await generate(prompt);
  const cited = searchCatalog(text, products).slice(0, 3).map((hit) => hit.product);
  return { reply: text, products: cited, source: "vertex-gemini", model };
}
