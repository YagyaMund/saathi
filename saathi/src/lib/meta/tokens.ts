import type { Shop } from "@prisma/client";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { refreshLongLivedToken } from "@/lib/meta/oauth";

const REFRESH_IF_WITHIN_MS = 7 * 24 * 60 * 60 * 1000; // refresh when <7 days left

export function shopHasMetaToken(shop: Pick<Shop, "metaTokenEnc" | "igUserId">) {
  return Boolean(shop.metaTokenEnc && shop.igUserId);
}

export async function storeShopMetaToken(opts: {
  shopId: string;
  igUserId: string;
  accessToken: string;
  expiresInSec: number;
  handle?: string | null;
  followers?: number | null;
}) {
  const enc = encryptSecret(opts.accessToken);
  const expires = new Date(Date.now() + opts.expiresInSec * 1000);
  return prisma.shop.update({
    where: { id: opts.shopId },
    data: {
      igUserId: opts.igUserId,
      metaTokenEnc: enc,
      metaTokenExpiresAt: expires,
      instagramConnectedAt: new Date(),
      instagramSim: false,
      instagramHandle: opts.handle
        ? opts.handle.startsWith("@")
          ? opts.handle
          : `@${opts.handle}`
        : undefined,
      instagramFollowers: opts.followers ?? undefined,
    },
  });
}

export async function clearShopMetaToken(shopId: string) {
  return prisma.shop.update({
    where: { id: shopId },
    data: {
      igUserId: null,
      metaTokenEnc: null,
      metaTokenExpiresAt: null,
      instagramConnectedAt: null,
      instagramSim: true,
    },
  });
}

/** Decrypt token; refresh if nearing expiry. */
export async function getValidAccessToken(shop: Shop): Promise<string | null> {
  if (!shop.metaTokenEnc) return null;
  let token = decryptSecret(shop.metaTokenEnc);
  const expiresAt = shop.metaTokenExpiresAt?.getTime() ?? 0;
  const needsRefresh =
    expiresAt > 0 && expiresAt - Date.now() < REFRESH_IF_WITHIN_MS;

  if (needsRefresh) {
    try {
      const refreshed = await refreshLongLivedToken(token);
      token = refreshed.accessToken;
      await prisma.shop.update({
        where: { id: shop.id },
        data: {
          metaTokenEnc: encryptSecret(token),
          metaTokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
        },
      });
    } catch {
      // keep existing token; caller may still succeed until hard expiry
    }
  }
  return token;
}
