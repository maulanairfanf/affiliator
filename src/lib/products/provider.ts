import type { ProductSource } from "@/lib/constants";
import type { ProductSearchResult } from "@/types/product";

export interface ProductProvider {
  source: ProductSource;
  search(query: string): Promise<ProductSearchResult[]>;
  extract(url: string): Promise<ProductSearchResult>;
}

export function detectSource(url: string): ProductSource {
  if (url.includes("shopee.co.id") || url.includes("shopee")) return "shopee" as ProductSource;
  if (url.includes("amazon")) return "amazon" as ProductSource;
  return "manual" as ProductSource;
}

export class ManualProvider implements ProductProvider {
  source = "manual" as ProductSource;

  async search(_query: string): Promise<ProductSearchResult[]> {
    void _query;
    return [];
  }

  async extract(url: string): Promise<ProductSearchResult> {
    const { scrapeFromUrl } = await import("@/lib/products/scraper");
    return scrapeFromUrl(url);
  }
}

const registry: Record<string, () => Promise<ProductProvider>> = {
  shopee: async () => {
    const { ShopeeProvider } = await import("@/lib/products/shopee");
    return new ShopeeProvider();
  },
  amazon: async () => {
    const { AmazonProvider } = await import("@/lib/products/amazon");
    return new AmazonProvider();
  },
  manual: async () => new ManualProvider(),
};

export async function getProvider(source: ProductSource): Promise<ProductProvider> {
  const factory = registry[source];
  if (!factory) throw new Error(`Unknown product source: ${source}`);
  return factory();
}
