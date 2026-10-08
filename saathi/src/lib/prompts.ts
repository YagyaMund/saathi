import { readFileSync, readdirSync } from "fs";
import path from "path";

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

export function listAgentPromptFiles() {
  return readdirSync(PROMPTS_DIR)
    .filter((f) => /^\d+-/.test(f))
    .sort();
}

export function loadAgentPrompt(slugPart: string): string {
  const files = listAgentPromptFiles();
  const match = files.find((f) => f.includes(slugPart));
  if (!match) throw new Error(`Prompt not found: ${slugPart}`);
  const raw = readFileSync(path.join(PROMPTS_DIR, match), "utf8");
  const fence = raw.match(/```text\n([\s\S]*?)```/);
  return (fence?.[1] || raw).trim();
}

export function houseRules(): string {
  try {
    return readFileSync(path.join(PROMPTS_DIR, "_house-rules.md"), "utf8");
  } catch {
    return "";
  }
}

export function buildSharedContext(shop: {
  sellerName: string;
  name: string;
  instagramHandle: string | null;
  city: string;
  sellerLanguage: string;
  buyerLanguages: string;
  categories: string;
  variantAxes: string;
}, catalogueXml: string, pendingXml: string, conversationXml = "") {
  return `<shop>
  seller_name: ${shop.sellerName}
  shop_name: ${shop.name}
  instagram: ${shop.instagramHandle || ""}
  city: ${shop.city}
  seller_language: ${shop.sellerLanguage}
  buyer_languages: [${shop.buyerLanguages}]
  categories: ${shop.categories}
  variant_axes: ${shop.variantAxes}
</shop>

<catalogue>
${catalogueXml}
</catalogue>

<pending>
${pendingXml}
</pending>

<policies>
  delivery: local hand delivery, courier elsewhere, 4-6 days
  returns: exchange within 3 days, no refunds
  payment: UPI to the shop QR only
</policies>

<conversation>
${conversationXml}
</conversation>`;
}
