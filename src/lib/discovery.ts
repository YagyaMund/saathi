import { searchEnabled, runtimeConfig } from "@/lib/config";
import { gcpFetch, readError } from "@/lib/gcp";
import { searchCatalog } from "@/lib/search";
import type { Product, SearchHit } from "@/lib/types";

type DiscoveryDocument = {
  id?: string;
  name?: string;
  structData?: Record<string, unknown>;
  jsonData?: string;
  derivedStructData?: { snippets?: Array<{ snippet?: string }> };
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function documentId(document: DiscoveryDocument | undefined, fallback?: string): string {
  if (document?.id) return document.id;
  if (fallback) return fallback;
  const name = document?.name ?? "";
  return name.split("/").pop() ?? "";
}

function structOf(document: DiscoveryDocument | undefined): Record<string, unknown> {
  if (!document) return {};
  if (document.structData) return document.structData;
  if (!document.jsonData) return {};
  try {
    return asRecord(JSON.parse(document.jsonData));
  } catch {
    return {};
  }
}

function productFromDocument(
  document: DiscoveryDocument | undefined,
  fallbackId: string | undefined,
  catalog: Product[],
): SearchHit | undefined {
  const id = documentId(document, fallbackId);
  const known = catalog.find((product) => product.id === id || product.slug === id);
  const data = structOf(document);
  const snippet =
    document?.derivedStructData?.snippets?.find((item) => item.snippet)?.snippet ||
    (typeof data.description === "string" ? data.description : known?.summary);
  if (known) {
    return { product: known, snippet: snippet || known.summary, score: 1 };
  }

  const name = typeof data.title === "string" ? data.title : typeof data.name === "string" ? data.name : "";
  if (!name) return undefined;
  const categories = Array.isArray(data.categories) ? data.categories.map(String) : [];
  const price = typeof data.price === "number" ? data.price : Number(data.price) || 0;
  return {
    score: 1,
    snippet: snippet || name,
    product: {
      id: id || name,
      slug: id || name,
      name,
      category: categories[0] || "Catalog",
      price,
      summary: snippet || name,
      description: snippet || name,
      materials: "",
      weightGrams: 0,
      origin: "",
      sku: id,
      tags: [],
      image: "harbor-weekender.svg",
      localInsight: "",
    },
  };
}

export async function searchProducts(
  query: string,
  products: Product[],
): Promise<{ source: "discovery-engine" | "local"; results: SearchHit[] }> {
  const trimmed = query.trim();
  if (!trimmed) return { source: searchEnabled() ? "discovery-engine" : "local", results: [] };
  if (!searchEnabled()) {
    return { source: "local", results: searchCatalog(trimmed, products) };
  }

  const config = runtimeConfig();
  const parent = config.discoveryEngineId
    ? `projects/${config.projectId}/locations/${config.discoveryLocation}/collections/default_collection/engines/${config.discoveryEngineId}/servingConfigs/default_search`
    : `projects/${config.projectId}/locations/${config.discoveryLocation}/collections/default_collection/dataStores/${config.discoveryDataStoreId}/servingConfigs/default_search`;
  const response = await gcpFetch(
    `https://discoveryengine.googleapis.com/v1/${parent}:search`,
    config.projectId,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: trimmed,
        pageSize: 8,
        contentSearchSpec: { snippetSpec: { returnSnippet: true } },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const payload = (await response.json()) as {
    results?: Array<{ id?: string; document?: DiscoveryDocument }>;
  };
  const results = (payload.results ?? [])
    .map((result) => productFromDocument(result.document, result.id, products))
    .filter((hit): hit is SearchHit => Boolean(hit));
  return { source: "discovery-engine", results };
}
