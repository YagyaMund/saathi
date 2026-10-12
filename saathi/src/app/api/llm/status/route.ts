import { NextResponse } from "next/server";
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
  });
}
