import { ProductCard } from "@/components/product-card";
import { StateMessage } from "@/components/state-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogReadError, listProducts } from "@/lib/catalog";
import { categoriesFrom } from "@/lib/local-data";
import type { Product } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The floor",
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const category = one((await searchParams).category);
  let products: Product[] = [];
  let source: "postgres" | "catalog" = "catalog";
  let failure = "";
  try {
    const loaded = await listProducts();
    products = loaded.products;
    source = loaded.source;
  } catch (error) {
    failure = error instanceof CatalogReadError ? error.message : "The catalog could not be read.";
    products = [];
  }

  const categories = categoriesFrom(products);
  const visible =
    category && category !== "all"
      ? products.filter((product) => product.category === category)
      : products;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="max-w-3xl">
        <p className="text-sm tracking-wide text-copper uppercase">Portland · Coast and trail</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight text-balance sm:text-6xl">
          Twelve pieces. Nothing you have to talk yourself into.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Cove Supply is a small floor of bags, wool, and weather gear. Search it the way a good
          associate would, then see how the season actually sold.
        </p>
        <form action="/search" className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="home-search">
            Search the catalog
          </label>
          <Input
            id="home-search"
            name="q"
            placeholder="Wool, rain, a weekend bag"
            className="h-11 text-base"
          />
          <Button type="submit" className="h-11 px-5">
            Search the floor
          </Button>
        </form>
      </section>

      {failure ? (
        <div className="mt-12">
          <StateMessage title="The catalog is unreachable." body={failure} />
        </div>
      ) : (
        <section className="mt-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-3xl">On the floor</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {source === "postgres" ? "Read from the operational database." : "Local catalog of twelve."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge render={<Link href="/" />} variant={!category || category === "all" ? "default" : "outline"}>
                All
              </Badge>
              {categories.map((item) => (
                <Badge
                  key={item}
                  render={<Link href={`/?category=${encodeURIComponent(item)}`} />}
                  variant={category === item ? "default" : "outline"}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="mt-8">
              <StateMessage
                title="Nothing in that category."
                body="The floor is small on purpose. Choose another category, or look at the whole catalog."
              />
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
