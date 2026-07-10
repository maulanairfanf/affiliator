import type { ProductSearchResult } from "@/types/product";
import { ProductSource } from "@/lib/constants";
import { searchProducts as shopeeSearch } from "@/lib/products/shopee";
import { searchProducts as amazonSearch } from "@/lib/products/amazon";
import { scrapeFromUrl } from "@/lib/products/scraper";

export async function searchProducts(
  query: string,
  source: ProductSource
): Promise<ProductSearchResult[]> {
  switch (source) {
    case ProductSource.Shopee:
      return shopeeSearch(query);
    case ProductSource.Amazon:
      return amazonSearch(query);
    case ProductSource.Manual:
      return [await scrapeFromUrl(query)];
    default:
      return [];
  }
}
