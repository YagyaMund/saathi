import { NextResponse } from "next/server";
import { metaWebhookVerifyToken } from "@/lib/meta/config";
import {
  handleInstagramWebhookPayload,
  verifyMetaSignature,
} from "@/lib/meta/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta webhook verification challenge. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = metaWebhookVerifyToken();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/** Event notifications — ACK fast after signature check + persist. */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Parameters<typeof handleInstagramWebhookPayload>[0];
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // Process inline but keep work light (upserts only). Heavy agent work stays async elsewhere.
  try {
    await handleInstagramWebhookPayload(body);
  } catch (e) {
    console.error("meta webhook handler", e);
  }

  return NextResponse.json({ ok: true });
}
