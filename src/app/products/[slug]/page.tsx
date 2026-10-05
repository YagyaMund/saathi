import { FloorNote } from "@/components/floor-note";
import { FloorNoteSkeleton } from "@/components/floor-note-skeleton";
import { StateMessage } from "@/components/state-message";
import { Badge } from "@/components/ui/badge";
import { CatalogReadError, getProduct } from "@/lib/catalog";
import { money } from "@/lib/money";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { product } = await getProduct(slug);
    if (!product) return { title: "Not on the floor" };
    return { title: product.name, description: product.summary };
  } catch {
    return { title: "Catalog unavailable" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product;
  let source: "postgres" | "catalog" = "catalog";
  try {
    const loaded = await getProduct(slug);
    product = loaded.product;
    source = loaded.source;
  } catch (error) {
    const message =
      error instanceof CatalogReadError ? error.message : "The catalog could not be read.";
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <StateMessage title="The catalog is unreachable." body={message} />
      </div>
    );
  }

  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        Back to the floor
      </Link>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Image
          src={`/api/assets/${product.image}`}
          alt={product.name}
          width={640}
          height={800}
          unoptimized
          priority
          className="aspect-[4/5] h-auto w-full rounded-2xl bg-secondary object-cover"
        />
        <div>
          <Badge variant="outline">{product.category}</Badge>
          <h1 className="mt-3 font-heading text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-2xl">{money(product.price)}</p>
          <p className="mt-5 text-base leading-7 text-muted-foreground">{product.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Materials</dt>
              <dd className="mt-1 leading-6">{product.materials}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Weight</dt>
              <dd className="mt-1">{product.weightGrams} g</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Origin</dt>
              <dd className="mt-1">{product.origin}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="mt-1">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Catalog</dt>
              <dd className="mt-1">{source === "postgres" ? "Operational database" : "Local file"}</dd>
            </div>
          </dl>
          <div className="mt-8">
            <Suspense fallback={<FloorNoteSkeleton />}>
              <FloorNote product={product} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
