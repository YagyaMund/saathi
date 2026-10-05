import { isAssetName, readAsset } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  if (!isAssetName(name)) {
    return NextResponse.json({ error: "Unknown asset." }, { status: 404 });
  }
  try {
    const asset = await readAsset(name);
    return new NextResponse(Buffer.from(asset.bytes), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
        "X-Cove-Asset-Source": asset.source,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Asset unreadable.";
    const status = message.includes("ENOENT") || message.includes("No such object") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
