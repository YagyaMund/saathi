import { adcReady, preferGoogleAdc } from "@/lib/google/adc";
import {
  fetchImageAsVertexPart,
  vertexGenerateContent,
  type VertexImagePart,
} from "@/lib/google/vertex";
import { houseRules, loadAgentPrompt } from "@/lib/prompts";

/** Production path is Vertex Gemini via ADC only. */
export type LlmMode = "gemini" | "mock";

/** Cloud Run / GCE — never silent-mock agents in production. */
function isCloudRuntime() {
  return Boolean(
    process.env.K_SERVICE ||
      process.env.K_REVISION ||
      process.env.GCE_METADATA_HOST,
  );
}

export function geminiConfigured() {
  return preferGoogleAdc();
}

export function llmConfigured() {
  return geminiConfigured();
}

export function llmStatusLabel(): "Gemini" | "Mock" {
  return preferGoogleAdc() ? "Gemini" : "Mock";
}

export function llmStatusDetail(): string {
  if (preferGoogleAdc()) {
    return "Gemini on Vertex (ADC) — multimodal vision for posts & screenshots";
  }
  return "Mock — run on Cloud Run, or locally: gcloud auth application-default login && GOOGLE_CLOUD_PROJECT=saathi-510820";
}

/**
 * Vertex Gemini via ADC only. Optional `images` for multimodal understanding
 * (Post Reader, payment screenshots). Not Imagen — we read images, we don't generate them.
 * On Cloud Run, ADC failures throw (no mock fallback). Local/dev may mock if ADC absent.
 */
export async function runAgentPrompt(opts: {
  agentSlug: string;
  sharedContext: string;
  userMessage: string;
  images?: VertexImagePart[];
}): Promise<{ text: string; mode: LlmMode }> {
  const instruction = [
    houseRules(),
    "",
    loadAgentPrompt(opts.agentSlug),
    "",
    opts.sharedContext,
  ].join("\n");

  if (!preferGoogleAdc()) {
    if (isCloudRuntime()) {
      throw new Error(
        `Vertex ADC required for agent "${opts.agentSlug}" on Cloud Run (mock disabled in production)`,
      );
    }
    return { text: mockReply(opts.agentSlug, opts.userMessage), mode: "mock" };
  }

  try {
    const text = await vertexGenerateContent({
      system: instruction,
      userMessage: opts.userMessage,
      images: opts.images,
    });
    return { text, mode: "gemini" };
  } catch (e) {
    if (isCloudRuntime() || (await adcReady())) throw e;
    return { text: mockReply(opts.agentSlug, opts.userMessage), mode: "mock" };
  }
}

/**
 * Post Reader / vision helper: load image URLs then call Vertex multimodal.
 * Used for Instagram post photos and UPI payment screenshots.
 */
export async function runAgentPromptWithImageUrls(opts: {
  agentSlug: string;
  sharedContext: string;
  userMessage: string;
  imageUrls: string[];
}): Promise<{ text: string; mode: LlmMode; imageCount: number }> {
  const images: VertexImagePart[] = [];
  for (const url of opts.imageUrls.slice(0, 8)) {
    try {
      images.push(await fetchImageAsVertexPart(url));
    } catch (e) {
      console.warn("vision image skip", url.slice(0, 60), e);
    }
  }
  const result = await runAgentPrompt({
    agentSlug: opts.agentSlug,
    sharedContext: opts.sharedContext,
    userMessage: opts.userMessage,
    images,
  });
  return { ...result, imageCount: images.length };
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
  return `Saathi (${slug}) mock — Vertex ADC required. You said: ${message.slice(0, 80)}`;
}

export { runAgentPrompt as default };
