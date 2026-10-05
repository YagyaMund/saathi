import { listProducts } from "@/lib/catalog";
import { searchProducts } from "@/lib/discovery";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const { products } = await listProducts();
    const result = await searchProducts(query, products);
    return NextResponse.json({ query, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
