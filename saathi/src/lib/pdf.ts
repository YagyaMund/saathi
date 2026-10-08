import { createWriteStream, mkdirSync } from "fs";
import path from "path";
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

  const dir = path.join(process.cwd(), "data", "pdfs", shopId);
  mkdirSync(dir, { recursive: true });
  const fileName = `catalogue-${Date.now()}.pdf`;
  const absPath = path.join(dir, fileName);
  const relPath = path.join("data", "pdfs", shopId, fileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const stream = createWriteStream(absPath);
    doc.pipe(stream);
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
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  const job = await prisma.pdfJob.create({
    data: {
      shopId,
      status: "ready",
      filePath: relPath,
    },
  });

  return { jobId: job.id, filePath: relPath };
}
