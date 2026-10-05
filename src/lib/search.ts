import type { Product, SearchHit } from "@/lib/types";

function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 1);
}

export function searchCatalog(query: string, products: Product[]): SearchHit[] {
  const needles = terms(query);
  if (needles.length === 0) return [];

  return products
    .map((product) => {
      const name = product.name.toLowerCase();
      const category = product.category.toLowerCase();
      const tags = product.tags.join(" ");
      const blob =
        `${name} ${category} ${tags} ${product.summary} ${product.description} ${product.materials}`.toLowerCase();
      let score = 0;
      for (const needle of needles) {
        if (name.includes(needle)) score += 5;
        if (category.includes(needle)) score += 3;
        if (tags.includes(needle)) score += 3;
        if (product.materials.toLowerCase().includes(needle)) score += 2;
        if (blob.includes(needle)) score += 1;
      }
      return { product, snippet: product.summary, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
}
