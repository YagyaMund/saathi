import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { metaConfigured } from "@/lib/meta/config";
import { buildInstagramAuthorizeUrl, signOAuthState } from "@/lib/meta/oauth";

export async function GET() {
  try {
    const session = await requireSession();
    if (!metaConfigured()) {
      return NextResponse.json(
        {
          error:
            "Instagram connect is not configured. Add META_APP_ID and META_APP_SECRET to the server environment.",
        },
        { status: 503 },
      );
    }
    const state = await signOAuthState(session.shopId);
    const url = buildInstagramAuthorizeUrl(state);
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not start Instagram login" },
      { status: 400 },
    );
  }
}
