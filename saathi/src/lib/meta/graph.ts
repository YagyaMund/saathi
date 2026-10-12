import { IG_GRAPH } from "@/lib/meta/config";

type GraphError = { error?: { message?: string; code?: number } };

async function graphGet<T>(
  path: string,
  accessToken: string,
  query: Record<string, string> = {},
): Promise<T> {
  const params = new URLSearchParams({ ...query, access_token: accessToken });
  const url = path.startsWith("http")
    ? `${path}${path.includes("?") ? "&" : "?"}${params}`
    : `${IG_GRAPH}${path.startsWith("/") ? path : `/${path}`}?${params}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = (await res.json()) as T & GraphError;
  if (!res.ok) {
    throw new Error(data.error?.message || `Graph GET ${path} failed (${res.status})`);
  }
  return data;
}

async function graphPost<T>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<T> {
  const url = `${IG_GRAPH}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & GraphError;
  if (!res.ok) {
    throw new Error(data.error?.message || `Graph POST ${path} failed (${res.status})`);
  }
  return data;
}

export type IgProfile = {
  id: string;
  user_id?: string;
  username?: string;
  name?: string;
  account_type?: string;
  followers_count?: number;
};

export async function fetchIgProfile(accessToken: string): Promise<IgProfile> {
  return graphGet<IgProfile>("/me", accessToken, {
    fields: "id,user_id,username,name,account_type,followers_count",
  });
}

export type IgMediaNode = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: { data?: { id: string; media_type?: string; media_url?: string }[] };
};

export async function fetchIgMedia(
  accessToken: string,
  limit = 25,
): Promise<IgMediaNode[]> {
  const data = await graphGet<{ data?: IgMediaNode[] }>("/me/media", accessToken, {
    fields:
      "id,caption,media_type,media_url,permalink,timestamp,children{id,media_type,media_url}",
    limit: String(limit),
  });
  return data.data || [];
}

export async function replyToCommentPublic(
  accessToken: string,
  commentId: string,
  message: string,
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`/${commentId}/replies`, accessToken, {
    message,
  });
}

export async function hideComment(
  accessToken: string,
  commentId: string,
  hide = true,
): Promise<{ success?: boolean }> {
  return graphPost(`/${commentId}`, accessToken, { hide });
}

/** One private DM to a commenter (Instagram Login). */
export async function sendPrivateReply(
  accessToken: string,
  igUserId: string,
  commentId: string,
  text: string,
): Promise<{ recipient_id?: string; message_id?: string }> {
  return graphPost(`/${igUserId}/messages`, accessToken, {
    recipient: { comment_id: commentId },
    message: { text },
  });
}

export async function sendDirectMessage(
  accessToken: string,
  igUserId: string,
  recipientIgsid: string,
  text: string,
): Promise<{ recipient_id?: string; message_id?: string }> {
  return graphPost(`/${igUserId}/messages`, accessToken, {
    recipient: { id: recipientIgsid },
    message: { text },
  });
}

export async function subscribeAppWebhooks(
  accessToken: string,
  igUserId: string,
): Promise<void> {
  const params = new URLSearchParams({
    subscribed_fields: "comments,messages",
    access_token: accessToken,
  });
  const res = await fetch(
    `${IG_GRAPH}/${igUserId}/subscribed_apps?${params.toString()}`,
    { method: "POST" },
  );
  const data = (await res.json()) as { success?: boolean; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message || `Subscribe webhooks failed (${res.status})`);
  }
}
