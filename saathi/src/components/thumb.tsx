import { TONE } from "@/lib/shop-data";

export function Thumb({
  tone,
  w = 46,
  h = 56,
}: {
  tone: string;
  w?: number;
  h?: number;
}) {
  return (
    <span
      className="thumb"
      style={{
        width: w,
        height: h,
        background: TONE[tone] || "var(--surface-3)",
      }}
    />
  );
}
