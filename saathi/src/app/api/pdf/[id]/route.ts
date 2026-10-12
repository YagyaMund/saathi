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
    if (!job?.content || job.content.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const filename = job.filePath?.endsWith(".pdf")
      ? job.filePath
      : "saathi-catalogue.pdf";
    return new NextResponse(Uint8Array.from(job.content), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Download failed" },
      { status: 400 },
    );
  }
}
