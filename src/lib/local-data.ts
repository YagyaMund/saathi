import catalogJson from "../../data/catalog.json";
import warehouseJson from "../../data/warehouse.json";
import type { Product, Warehouse } from "@/lib/types";

export const localCatalog = catalogJson as Product[];
export const localWarehouse = warehouseJson as Warehouse;

export function categoriesFrom(products: Product[]): string[] {
  return [...new Set(products.map((product) => product.category))].sort();
}
