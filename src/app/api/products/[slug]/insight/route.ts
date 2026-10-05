import { getProduct } from "@/lib/catalog";
import { productInsight } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  try {
    const { product } = await getProduct(slug);
    if (!product) {
      return NextResponse.json({ error: "That piece is not on the floor." }, { status: 404 });
    }
    const insight = await productInsight(product);
    return NextResponse.json(insight);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini did not answer.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
