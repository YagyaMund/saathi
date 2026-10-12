import { houseRules, loadAgentPrompt } from "@/lib/prompts";

export type LlmMode = "openai" | "gemini" | "mock";

export function openaiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

/** Prefer OpenAI when OPENAI_API_KEY is set; else Gemini; else deterministic mocks. */
export function llmConfigured() {
  return openaiConfigured() || geminiConfigured();
}

export async function runAgentPrompt(opts: {
  agentSlug: string;
  sharedContext: string;
  userMessage: string;
}): Promise<{ text: string; mode: LlmMode }> {
  const instruction = [
    houseRules(),
    "",
    loadAgentPrompt(opts.agentSlug),
    "",
    opts.sharedContext,
  ].join("\n");

  if (openaiConfigured()) {
    const text = await runOpenAI(instruction, opts.userMessage);
    return { text, mode: "openai" };
  }

  if (geminiConfigured()) {
    const text = await runGemini(instruction, opts.userMessage);
    return { text, mode: "gemini" };
  }

  return { text: mockReply(opts.agentSlug, opts.userMessage), mode: "mock" };
}

async function runOpenAI(system: string, userMessage: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI failed: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function runGemini(system: string, userMessage: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!;
  const model = process.env.SAATHI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
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
  return (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
    ""
  );
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
  return `Saathi (${slug}) mock reply — set OPENAI_API_KEY or GEMINI_API_KEY for live LLM. You said: ${message.slice(0, 80)}`;
}
