/**
 * Instagram API with Instagram Login (preferred).
 * Messaging + comments without a Facebook Page.
 * See /cursor/stores/self/docs/instagram-api-gap.md
 */

export const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v22.0";
export const IG_GRAPH = `https://graph.instagram.com/${META_GRAPH_VERSION}`;
export const IG_API = "https://api.instagram.com";

export const IG_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
] as const;

export function metaConfigured(): boolean {
  return Boolean(
    process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim(),
  );
}

export function metaAppId() {
  return process.env.META_APP_ID?.trim() || "";
}

export function metaAppSecret() {
  return process.env.META_APP_SECRET?.trim() || "";
}

export function metaWebhookVerifyToken() {
  return process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || "";
}

/** Public base URL for OAuth redirect + webhook docs. */
export function appBaseUrl(): string {
  if (process.env.APP_BASE_URL?.trim()) return process.env.APP_BASE_URL.trim().replace(/\/$/, "");
  if (process.env.META_REDIRECT_URI?.trim()) {
    try {
      const u = new URL(process.env.META_REDIRECT_URI.trim());
      return `${u.protocol}//${u.host}`;
    } catch {
      /* fall through */
    }
  }
  // Prefer stable production host over per-deploy VERCEL_URL previews
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://127.0.0.1:4747";
}

export function metaRedirectUri(): string {
  if (process.env.META_REDIRECT_URI?.trim()) {
    return process.env.META_REDIRECT_URI.trim();
  }
  return `${appBaseUrl()}/api/auth/instagram/callback`;
}

export function metaLoginPathChoice(): "instagram_login" {
  return "instagram_login";
}
