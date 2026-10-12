import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";

/** Helvetica/WinAnsi cannot encode ₹ — use ASCII for PDF body. */
function inrPdf(value: number): string {
  return `Rs ${Number(value).toLocaleString("en-IN")}`;
}

/** Manual catalogue PDF — only when she taps Generate. Never auto on stock change. */
export async function generateCataloguePdf(shopId: string): Promise<{
  jobId: string;
  filePath: string;
}> {
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
  const items = await prisma.item.findMany({
    where: { shopId, status: "live" },
    include: { variants: true },
    orderBy: { name: "asc" },
  });

  const fileName = `catalogue-${Date.now()}.pdf`;
  const buffer = await renderCataloguePdfBuffer(shop, items);

  // Persist bytes in Postgres — Vercel /var/task is read-only; /tmp does not
  // survive across generate → download on separate serverless invocations.
  const job = await prisma.pdfJob.create({
    data: {
      shopId,
      status: "ready",
      filePath: fileName,
      content: buffer,
    },
  });

  return { jobId: job.id, filePath: fileName };
}

type ShopRow = {
  name: string;
  city: string;
  instagramHandle: string | null;
};

type ItemRow = {
  name: string;
  category: string;
  description: string;
  priceInr: number;
  floorInr: number;
  variants: { stock: number }[];
};

async function renderCataloguePdfBuffer(
  shop: ShopRow,
  items: ItemRow[],
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595.28, 841.89]); // A4
  const margin = 48;
  let y = page.getHeight() - margin;
  const maxWidth = page.getWidth() - margin * 2;
  const ink = rgb(0.086, 0.094, 0.082);
  const muted = rgb(0.369, 0.388, 0.357);
  const accent = rgb(0.082, 0.439, 0.31);

  const ensureSpace = (need: number) => {
    if (y - need < margin) {
      page = doc.addPage([595.28, 841.89]);
      y = page.getHeight() - margin;
    }
  };

  const draw = (
    text: string,
    size: number,
    color: ReturnType<typeof rgb>,
    bold = false,
  ) => {
    const f = bold ? fontBold : font;
    const lines = wrapText(text, f, size, maxWidth);
    for (const line of lines) {
      ensureSpace(size + 4);
      page.drawText(line, {
        x: margin,
        y: y - size,
        size,
        font: f,
        color,
      });
      y -= size + 4;
    }
  };

  draw(shop.name, 22, ink, true);
  y -= 4;
  draw(`${shop.city} · ${shop.instagramHandle || ""}`, 11, muted);
  y -= 8;
  draw(
    "Catalogue for sharing with neighbours. Generated only when you asked.",
    10,
    ink,
  );
  y -= 12;

  if (items.length === 0) {
    draw("No approved items yet.", 11, muted);
  }

  for (const item of items) {
    const stock = item.variants.reduce((a, v) => a + v.stock, 0);
    ensureSpace(48);
    // name + price on one visual block
    page.drawText(item.name, {
      x: margin,
      y: y - 13,
      size: 13,
      font: fontBold,
      color: ink,
    });
    const price = inr(item.priceInr);
    const pw = fontBold.widthOfTextAtSize(price, 13);
    page.drawText(price, {
      x: margin + maxWidth - pw,
      y: y - 13,
      size: 13,
      font: fontBold,
      color: accent,
    });
    y -= 18;
    draw(
      `${item.category} · ${stock} in stock · floor ${inr(item.floorInr)}`,
      10,
      muted,
    );
    if (item.description) {
      draw(item.description, 10, ink);
    }
    y -= 10;
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}
