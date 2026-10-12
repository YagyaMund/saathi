import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/money";

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

  // Persist bytes in Postgres — Vercel serverless cannot mkdir under /var/task,
  // and /tmp does not survive across generate → download invocations.
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

function renderCataloguePdfBuffer(
  shop: ShopRow,
  items: ItemRow[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).fillColor("#161815").text(shop.name, { align: "left" });
    doc.moveDown(0.3);
    doc
      .fontSize(11)
      .fillColor("#5E635B")
      .text(`${shop.city} · ${shop.instagramHandle || ""}`);
    doc.moveDown();
    doc
      .fontSize(10)
      .fillColor("#161815")
      .text(
        "Catalogue for sharing with neighbours. Generated only when you asked.",
      );
    doc.moveDown();

    if (items.length === 0) {
      doc.text("No approved items yet.");
    }

    for (const item of items) {
      const stock = item.variants.reduce((a, v) => a + v.stock, 0);
      doc
        .fontSize(13)
        .fillColor("#161815")
        .text(`${item.name}  `, { continued: true })
        .fillColor("#15704F")
        .text(inr(item.priceInr));
      doc
        .fontSize(10)
        .fillColor("#5E635B")
        .text(
          `${item.category} · ${stock} in stock · floor ${inr(item.floorInr)}`,
        );
      if (item.description) {
        doc.fontSize(10).fillColor("#161815").text(item.description);
      }
      doc.moveDown(0.8);
    }

    doc.end();
  });
}
