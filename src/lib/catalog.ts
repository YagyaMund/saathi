import { Pool } from "pg";
import { runtimeConfig } from "@/lib/config";
import { localCatalog } from "@/lib/local-data";
import type { Product } from "@/lib/types";

export class CatalogReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogReadError";
  }
}

let pool: Pool | undefined;

function getPool(connectionString: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString, max: 3 });
  }
  return pool;
}

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category),
    price: Number(row.price_cents) / 100,
    summary: String(row.summary),
    description: String(row.description),
    materials: String(row.materials),
    weightGrams: Number(row.weight_grams),
    origin: String(row.origin),
    sku: String(row.sku),
    tags: asTags(row.tags),
    image: String(row.image),
    localInsight: String(row.local_insight),
  };
}

export async function listProducts(): Promise<{
  products: Product[];
  source: "postgres" | "catalog";
}> {
  const { databaseUrl } = runtimeConfig();
  if (!databaseUrl) {
    return { products: localCatalog, source: "catalog" };
  }

  try {
    const result = await getPool(databaseUrl).query(
      `SELECT id, slug, name, category, price_cents, summary, description,
              materials, weight_grams, origin, sku, image, tags, local_insight
       FROM products
       ORDER BY name`,
    );
    return {
      products: result.rows.map((row: Record<string, unknown>) => rowToProduct(row)),
      source: "postgres",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    throw new CatalogReadError(
      `The operational database did not answer (${message}). Check DATABASE_URL, or unset it to use the local catalog.`,
    );
  }
}

export async function getProduct(slug: string): Promise<{
  product: Product | undefined;
  source: "postgres" | "catalog";
}> {
  const { products, source } = await listProducts();
  return {
    product: products.find((item) => item.slug === slug),
    source,
  };
}
