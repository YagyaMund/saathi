/**
 * All Saathi staff agents. Runtime invoke always goes through
 * `runAgentPrompt` / `runAgentPromptWithImageUrls` → Vertex Gemini ADC.
 *
 * `invoke` describes whether this deploy has a live API path that calls Vertex.
 * Agents without a live path still load their prompt via Vertex when wired;
 * they are not on a separate mock/LLM-key stack.
 */

export type AgentDef = {
  slug: string;
  settingsKey: string;
  title: string;
  /** Live HTTP/job path that calls Vertex today */
  invoke: "live" | "prompt_only";
  /** Needs image parts for full fidelity */
  multimodal?: boolean;
  note?: string;
};

export const SAATHI_AGENTS: AgentDef[] = [
  {
    slug: "post-reader",
    settingsKey: "post_reader",
    title: "Post Reader",
    invoke: "live",
    multimodal: true,
    note: "POST /api/posts/[id]/read — vision when mediaUrl present",
  },
  {
    slug: "gap-filler",
    settingsKey: "gap_filler",
    title: "Gap Filler",
    invoke: "prompt_only",
    note: "Prompt + toggle; no dedicated run route yet",
  },
  {
    slug: "post-reviewer",
    settingsKey: "post_reviewer",
    title: "Post Reviewer",
    invoke: "prompt_only",
  },
  {
    slug: "catalogue-designer",
    settingsKey: "catalogue_designer",
    title: "Catalogue Designer",
    invoke: "prompt_only",
  },
  {
    slug: "comment-responder",
    settingsKey: "comment_responder",
    title: "Comment Responder",
    invoke: "prompt_only",
    note: "Webhook upserts comments; agent reply not auto-invoked yet",
  },
  {
    slug: "salesperson",
    settingsKey: "salesperson",
    title: "Salesperson",
    invoke: "prompt_only",
    note: "Webhook upserts DMs; agent reply not auto-invoked yet",
  },
  {
    slug: "negotiator",
    settingsKey: "negotiator",
    title: "Negotiator",
    invoke: "prompt_only",
  },
  {
    slug: "order-taker",
    settingsKey: "order_taker",
    title: "Order Taker",
    invoke: "prompt_only",
  },
  {
    slug: "payment-verifier",
    settingsKey: "payment_verifier",
    title: "Payment Verifier",
    invoke: "prompt_only",
    multimodal: true,
    note: "Prompt ready for screenshot vision; no dedicated run route yet",
  },
  {
    slug: "shift-manager",
    settingsKey: "shift_manager",
    title: "Shift Manager",
    invoke: "prompt_only",
  },
  {
    slug: "shop-analyst",
    settingsKey: "shop_analyst",
    title: "Shop Analyst",
    invoke: "live",
    note: "POST /api/analyst — text Vertex; TTS still stub",
  },
];
