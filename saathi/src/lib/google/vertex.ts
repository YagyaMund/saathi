import { gcpProjectId, gcpRegion, getAccessToken } from "@/lib/google/adc";

/**
 * Vertex AI Gemini generateContent via ADC (no API key).
 * https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference
 */
export async function vertexGenerateContent(opts: {
  system: string;
  userMessage: string;
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

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [
        { role: "user", parts: [{ text: opts.userMessage }] },
      ],
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
