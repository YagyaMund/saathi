import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/meta/config";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  verifyOAuthState,
} from "@/lib/meta/oauth";
import { fetchIgProfile, subscribeAppWebhooks } from "@/lib/meta/graph";
import { getInstagramChannel } from "@/lib/meta/channel";
import { storeShopMetaToken } from "@/lib/meta/tokens";
import { prisma } from "@/lib/db";

function redirectSettings(query: Record<string, string>) {
  const u = new URL("/app/settings", appBaseUrl());
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
  return NextResponse.redirect(u.toString());
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  if (err) {
    return redirectSettings({
      ig: "denied",
      reason: url.searchParams.get("error_reason") || err,
    });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectSettings({ ig: "error", reason: "missing_code" });
  }

  try {
    const shopId = await verifyOAuthState(state);
    const short = await exchangeCodeForShortLivedToken(code);
    const long = await exchangeForLongLivedToken(short.accessToken);
    const profile = await fetchIgProfile(long.accessToken);

    const accountType = (profile.account_type || "").toUpperCase();
    if (
      accountType &&
      accountType !== "BUSINESS" &&
      accountType !== "CREATOR" &&
      accountType !== "MEDIA_CREATOR"
    ) {
      return redirectSettings({
        ig: "error",
        reason: "need_professional",
      });
    }

    const igUserId = String(profile.user_id || profile.id || short.userId);
    const shop = await storeShopMetaToken({
      shopId,
      igUserId,
      accessToken: long.accessToken,
      expiresInSec: long.expiresIn,
      handle: profile.username || null,
      followers: profile.followers_count ?? null,
    });

    try {
      await subscribeAppWebhooks(long.accessToken, igUserId);
    } catch (e) {
      console.warn("webhook subscribe failed", e);
    }

    try {
      const channel = getInstagramChannel(shop);
      await channel.ingestMedia(30);
    } catch (e) {
      console.warn("media backfill failed", e);
    }

    await prisma.shop.findUnique({ where: { id: shopId } });
    return redirectSettings({ ig: "connected" });
  } catch (e) {
    console.error("instagram oauth callback", e);
    return redirectSettings({
      ig: "error",
      reason: e instanceof Error ? e.message.slice(0, 120) : "oauth_failed",
    });
  }
}
