export function inr(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export function parseInr(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
