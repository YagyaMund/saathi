import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { generateCataloguePdf } from "@/lib/pdf";

export async function POST() {
  try {
    const session = await requireSession();
    const job = await generateCataloguePdf(session.shopId);
    return NextResponse.json({
      ok: true,
      jobId: job.jobId,
      downloadUrl: `/api/pdf/${job.jobId}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF failed" },
      { status: 400 },
    );
  }
}
