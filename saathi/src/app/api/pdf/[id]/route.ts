import { readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const job = await prisma.pdfJob.findFirst({
      where: { id, shopId: session.shopId },
    });
    if (!job?.filePath) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const abs = path.join(process.cwd(), job.filePath);
    const buf = readFileSync(abs);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="saathi-catalogue.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Download failed" },
      { status: 400 },
    );
  }
}
