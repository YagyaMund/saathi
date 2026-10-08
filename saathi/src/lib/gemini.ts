import { houseRules, loadAgentPrompt } from "@/lib/prompts";

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

export async function runAgentPrompt(opts: {
  agentSlug: string;
  sharedContext: string;
  userMessage: string;
}): Promise<{ text: string; mode: "gemini" | "mock" }> {
  const instruction = [
    houseRules(),
    "",
    loadAgentPrompt(opts.agentSlug),
    "",
    opts.sharedContext,
  ].join("\n");

  if (!geminiConfigured()) {
    return { text: mockReply(opts.agentSlug, opts.userMessage), mode: "mock" };
  }

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!;
  const model = process.env.SAATHI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: "user", parts: [{ text: opts.userMessage }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini failed: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
    "";
  return { text, mode: "gemini" };
}

function mockReply(slug: string, message: string): string {
  if (slug.includes("shop-analyst") || slug.includes("analyst")) {
    return "Aaj do order. Nau log dinner set maang rahe hain. Anjali ka payment match nahi hua.";
  }
  if (slug.includes("salesperson") || slug.includes("comment")) {
    return "Haan ji, yeh catalogue mein hai. Size bataiye — main check karti hoon.";
  }
  if (slug.includes("shift")) {
    return JSON.stringify({
      escalate: true,
      reason: "needs_seller",
      note: message.slice(0, 120),
    });
  }
  if (slug.includes("post-reader")) {
    return JSON.stringify({
      post_type: "single_product",
      confidence: "medium",
      drafts: [
        {
          draft_id: "mock1",
          name: "Draft from post",
          category: "pottery",
          attributes: {},
          price_inr: null,
          missing: ["price", "stock"],
        },
      ],
    });
  }
  return `Saathi (${slug}) mock reply — set GEMINI_API_KEY for live Gemini. You said: ${message.slice(0, 80)}`;
}
