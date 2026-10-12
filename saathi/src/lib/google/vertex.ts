import { gcpProjectId, gcpRegion, getAccessToken } from "@/lib/google/adc";

/**
 * Image input for Gemini multimodal (understanding — not Imagen generation).
 * Prefer inline bytes for Instagram CDN URLs; use GCS URI when assets are in a bucket.
 */
export type VertexImagePart = {
  mimeType: string;
  /** Raw base64 (no data: prefix) */
  dataBase64?: string;
  /** gs://bucket/object */
  gcsUri?: string;
};

type ContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { mimeType: string; fileUri: string } };

function imageToPart(img: VertexImagePart): ContentPart {
  if (img.gcsUri) {
    return {
      fileData: { mimeType: img.mimeType, fileUri: img.gcsUri },
    };
  }
  if (img.dataBase64) {
    return {
      inlineData: { mimeType: img.mimeType, data: img.dataBase64 },
    };
  }
  throw new Error("Vertex image part needs dataBase64 or gcsUri");
}

/**
 * Vertex AI Gemini generateContent via ADC (no API key).
 * Supports text-only and multimodal (vision) for Post Reader / payment screenshots.
 * Imagen is a separate generation product — not used here.
 */
export async function vertexGenerateContent(opts: {
  system: string;
  userMessage: string;
  images?: VertexImagePart[];
  model?: string;
  temperature?: number;
}): Promise<string> {
  const project = gcpProjectId();
  const location = gcpRegion();
  const model =
    opts.model ||
    process.env.SAATHI_MODEL ||
    process.env.VERTEX_MODEL ||
    "gemini-2.5-flash";
  const token = await getAccessToken();
  const url =
    `https://${location}-aiplatform.googleapis.com/v1/projects/${project}` +
    `/locations/${location}/publishers/google/models/${model}:generateContent`;

  const parts: ContentPart[] = [{ text: opts.userMessage }];
  for (const img of opts.images || []) {
    parts.push(imageToPart(img));
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: opts.temperature ?? 0.2 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vertex Gemini failed: ${res.status} ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
    ""
  );
}

/** Fetch a remote image (e.g. Instagram media_url) into an inline Vertex part. */
export async function fetchImageAsVertexPart(
  url: string,
  maxBytes = 4_000_000,
): Promise<VertexImagePart> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status} ${url.slice(0, 80)}`);
  }
  const mimeType =
    res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) {
    throw new Error(`Image too large (${buf.length} bytes)`);
  }
  return { mimeType, dataBase64: buf.toString("base64") };
}
