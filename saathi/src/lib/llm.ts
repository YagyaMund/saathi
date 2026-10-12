import { adcReady, preferGoogleAdc } from "@/lib/google/adc";
import { vertexGenerateContent } from "@/lib/google/vertex";
import { houseRules, loadAgentPrompt } from "@/lib/prompts";

/** User-facing / status labels — never vendor names for interim keys. */
export type LlmMode = "gemini" | "llm" | "mock";

function geminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.VERTEX_API_KEY?.trim() ||
    null
  );
}

/** OpenAI-compatible key: prefer LLM_API_KEY; OPENAI_API_KEY is a deprecated alias. */
export function compatibleLlmKey(): string | null {
  const key =
    process.env.LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function geminiConfigured() {
  // Vertex via ADC counts as Gemini configured (Cloud Run production path)
  if (preferGoogleAdc()) return true;
  return Boolean(geminiApiKey());
}

export function llmConfigured() {
  return geminiConfigured() || Boolean(compatibleLlmKey());
}

/**
 * Honest status for Settings.
 * Cloud Run + ADC → "Gemini" (Vertex). API key Gemini → "Gemini". Interim key → "LLM".
 */
export function llmStatusLabel(): "Gemini" | "LLM" | "Mock" {
  if (preferGoogleAdc() || geminiApiKey()) return "Gemini";
  if (compatibleLlmKey()) return "LLM";
  return "Mock";
}

export function llmStatusDetail(): string {
  if (preferGoogleAdc()) {
    return "Gemini on Vertex (ADC) — Cloud Run service account";
  }
  if (geminiApiKey()) {
    return "Gemini API key — local / Vercel path";
  }
  if (compatibleLlmKey()) {
    return "LLM connected — interim demo key";
  }
  return "Mock replies — set Vertex ADC (Cloud Run) or GEMINI_API_KEY / LLM_API_KEY";
}

/**
 * Precedence:
 * 1. Vertex Gemini via ADC (Cloud Run / GCP)
 * 2. Gemini API key (local / Vercel)
 * 3. Compatible LLM key (interim demos)
 * 4. Deterministic mocks
 */
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

  if (preferGoogleAdc()) {
    try {
      const text = await vertexGenerateContent({
        system: instruction,
        userMessage: opts.userMessage,
      });
      return { text, mode: "gemini" };
    } catch (e) {
      // If ADC token works but Vertex fails, surface the error — do not silently
      // fall through to a different provider on Cloud Run.
      if (await adcReady()) throw e;
      // Local misconfig: fall through
    }
  }

  const apiKey = geminiApiKey();
  if (apiKey) {
    const text = await runGeminiApiKey(apiKey, instruction, opts.userMessage);
    return { text, mode: "gemini" };
  }

  const compatKey = compatibleLlmKey();
  if (compatKey) {
    const text = await runCompatibleLlm(compatKey, instruction, opts.userMessage);
    return { text, mode: "llm" };
  }

  return { text: mockReply(opts.agentSlug, opts.userMessage), mode: "mock" };
}

async function runCompatibleLlm(
  key: string,
  system: string,
  userMessage: string,
): Promise<string> {
  const base = (
    process.env.LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch(`${base}/chat/completions`, {
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
    throw new Error(`LLM request failed: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

/** Google AI Studio / API-key Gemini (Vercel / local fallback). */
async function runGeminiApiKey(
  key: string,
  system: string,
  userMessage: string,
): Promise<string> {
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
    throw new Error(`Gemini API key failed: ${res.status} ${err.slice(0, 200)}`);
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
  return `Saathi (${slug}) mock reply — use Vertex ADC on Cloud Run, or GEMINI_API_KEY / LLM_API_KEY locally. You said: ${message.slice(0, 80)}`;
}

/** @deprecated Use `@/lib/llm` — kept so old imports keep working. */
export { runAgentPrompt as default };
