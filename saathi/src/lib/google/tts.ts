import { getAccessToken } from "@/lib/google/adc";

/**
 * Cloud Text-to-Speech via ADC (stub helper — evening report UI still text-first).
 * Does not run unless a caller invokes it; uses the Cloud Run service account.
 */
export async function synthesizeSpeech(opts: {
  text: string;
  languageCode?: string;
  voiceName?: string;
}): Promise<Buffer> {
  const token = await getAccessToken();
  const languageCode = opts.languageCode || "hi-IN";
  const res = await fetch(
    "https://texttospeech.googleapis.com/v1/text:synthesize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text: opts.text },
        voice: {
          languageCode,
          name: opts.voiceName || undefined,
        },
        audioConfig: { audioEncoding: "MP3" },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloud TTS failed: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) throw new Error("Cloud TTS: empty audio");
  return Buffer.from(data.audioContent, "base64");
}
