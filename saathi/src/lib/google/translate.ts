import { gcpProjectId, getAccessToken } from "@/lib/google/adc";

/**
 * Cloud Translation API (v3) via ADC — same credentials as Vertex.
 * Ready for Hindi/English buyer language matching; call sites can adopt later.
 */
export async function translateText(opts: {
  text: string;
  targetLanguageCode: string;
  sourceLanguageCode?: string;
}): Promise<string> {
  const project = gcpProjectId();
  const token = await getAccessToken();
  const url = `https://translation.googleapis.com/v3/projects/${project}/locations/global:translateText`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [opts.text],
      targetLanguageCode: opts.targetLanguageCode,
      ...(opts.sourceLanguageCode
        ? { sourceLanguageCode: opts.sourceLanguageCode }
        : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloud Translation failed: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    translations?: { translatedText?: string }[];
  };
  return data.translations?.[0]?.translatedText || opts.text;
}
