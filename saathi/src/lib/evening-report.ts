/** Shop Analyst JSON → seller-facing prose (never show raw JSON). */

export type AnalystFinding = {
  type?: string;
  finding?: string;
  evidence?: string;
  distinct_people?: number;
  confidence?: string;
  suggested_action?: string;
};

export type AnalystUrgent = {
  item_id?: string;
  issue?: string;
};

export type AnalystReport = {
  headline?: string;
  findings?: AnalystFinding[];
  urgent?: AnalystUrgent[];
  voice_script?: string;
  quiet_day?: boolean;
};

function stripFences(raw: string): string {
  let t = raw.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (m) t = m[1].trim();
  return t;
}

export function parseAnalystReport(raw: string): AnalystReport | null {
  if (!raw?.trim()) return null;
  const t = stripFences(raw);
  if (!t.startsWith("{") && !t.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(t) as AnalystReport;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* not JSON */
  }
  return null;
}

/**
 * Prefer voice_script; otherwise compose headline + findings + urgent
 * into readable Hindi/English paragraphs (no JSON punctuation).
 */
export function formatEveningReport(raw: string): string {
  if (!raw?.trim()) return "";
  const parsed = parseAnalystReport(raw);
  if (!parsed) {
    // Already prose (or fence-wrapped prose)
    const unfenced = stripFences(raw);
    if (unfenced.startsWith("{")) return "Evening report is ready — tap Run Shop Analyst again.";
    return unfenced;
  }

  const voice = (parsed.voice_script || "").trim();
  if (voice) return voice;

  const parts: string[] = [];
  if (parsed.headline?.trim()) parts.push(parsed.headline.trim());

  for (const f of parsed.findings || []) {
    const line = [f.finding, f.evidence, f.suggested_action]
      .map((x) => (x || "").trim())
      .filter(Boolean)
      .join(" — ");
    if (line) parts.push(line);
  }

  for (const u of parsed.urgent || []) {
    const line = [u.issue, u.item_id ? `(${u.item_id})` : ""]
      .map((x) => (x || "").trim())
      .filter(Boolean)
      .join(" ");
    if (line) parts.push(line);
  }

  if (parsed.quiet_day && parts.length === 0) {
    return "Aaj ordinary din tha — kuch special nahi.";
  }

  return parts.join("\n\n") || "Evening report is ready.";
}
