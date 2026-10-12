import { NextResponse } from "next/server";
import { SAATHI_AGENTS } from "@/lib/agents/registry";
import {
  adcReady,
  gcpProjectId,
  gcpRegion,
  preferGoogleAdc,
} from "@/lib/google/adc";
import { llmStatusDetail, llmStatusLabel } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  const preferAdc = preferGoogleAdc();
  const adc = preferAdc ? await adcReady() : false;
  const stack = preferAdc && adc ? "vertex-adc" : "mock-local-only";

  return NextResponse.json({
    label: llmStatusLabel(),
    detail: llmStatusDetail(),
    provider: "vertex-adc",
    vision: "gemini-multimodal",
    imagen: false,
    preferAdc,
    adc,
    project: gcpProjectId(),
    region: gcpRegion(),
    kService: Boolean(process.env.K_SERVICE),
    agents: SAATHI_AGENTS.map((a) => ({
      slug: a.slug,
      title: a.title,
      invoke: a.invoke,
      multimodal: Boolean(a.multimodal),
      llm:
        a.invoke === "live"
          ? stack === "vertex-adc"
            ? "vertex"
            : "mock"
          : "prompt_only_via_vertex_when_wired",
      note: a.note || null,
    })),
  });
}
