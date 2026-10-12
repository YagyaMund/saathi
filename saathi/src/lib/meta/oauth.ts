import { SignJWT, jwtVerify } from "jose";
import {
  IG_API,
  IG_GRAPH,
  IG_SCOPES,
  metaAppId,
  metaAppSecret,
  metaConfigured,
  metaRedirectUri,
} from "@/lib/meta/config";

function stateSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "saathi-dev-secret-change-me",
  );
}

export async function signOAuthState(shopId: string) {
  return new SignJWT({ shopId, purpose: "ig_oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(stateSecret());
}

export async function verifyOAuthState(state: string): Promise<string> {
  const { payload } = await jwtVerify(state, stateSecret());
  if (payload.purpose !== "ig_oauth" || typeof payload.shopId !== "string") {
    throw new Error("Invalid OAuth state");
  }
  return payload.shopId;
}

export function buildInstagramAuthorizeUrl(state: string): string {
  if (!metaConfigured()) {
    throw new Error("META_APP_ID and META_APP_SECRET are not set");
  }
  const params = new URLSearchParams({
    client_id: metaAppId(),
    redirect_uri: metaRedirectUri(),
    response_type: "code",
    scope: IG_SCOPES.join(","),
    state,
    enable_fb_login: "0",
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export type ShortLivedToken = {
  accessToken: string;
  userId: string;
  permissions: string;
};

export async function exchangeCodeForShortLivedToken(
  code: string,
): Promise<ShortLivedToken> {
  const body = new URLSearchParams({
    client_id: metaAppId(),
    client_secret: metaAppSecret(),
    grant_type: "authorization_code",
    redirect_uri: metaRedirectUri(),
    code: code.replace(/#_$/, ""),
  });
  const res = await fetch(`${IG_API}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as {
    access_token?: string;
    user_id?: string | number;
    permissions?: string;
    data?: {
      access_token?: string;
      user_id?: string | number;
      permissions?: string;
    }[];
    error_message?: string;
    error_type?: string;
  };
  if (!res.ok) {
    throw new Error(
      data.error_message || data.error_type || `Token exchange failed (${res.status})`,
    );
  }
  const row = data.data?.[0] || data;
  const accessToken = row.access_token;
  const userId = row.user_id != null ? String(row.user_id) : "";
  if (!accessToken || !userId) throw new Error("Token exchange missing fields");
  return {
    accessToken,
    userId,
    permissions: String(row.permissions || ""),
  };
}

export async function exchangeForLongLivedToken(shortLived: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: metaAppSecret(),
    access_token: shortLived,
  });
  const res = await fetch(`${IG_GRAPH}/access_token?${params.toString()}`);
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message || `Long-lived token failed (${res.status})`);
  }
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 60 * 24 * 60 * 60,
  };
}

/** Refresh a long-lived token (must be ≥24h old and not expired). */
export async function refreshLongLivedToken(token: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: token,
  });
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?${params.toString()}`,
  );
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message || `Token refresh failed (${res.status})`);
  }
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 60 * 24 * 60 * 60,
  };
}
