import type { ProductSearchResult } from "@/types/product";
import { ProductSource } from "@/lib/constants";
import type { ProductProvider } from "@/lib/products/provider";

interface ShopeeSearchResponse {
  items: Array<{
    title: string;
    price: number;
    image: string;
    link: string;
    description?: string;
  }>;
}

export class ShopeeProvider implements ProductProvider {
  source = ProductSource.Shopee;

  async search(query: string): Promise<ProductSearchResult[]> {
    const mockResponse: ShopeeSearchResponse = {
      items: [
        {
          title: `Shopee: ${query}`,
          price: 150000,
          image: "https://placehold.co/400x400?text=Shopee+Product",
          link: "https://shopee.co.id/product",
          description: `Hasil pencarian Shopee untuk: ${query}`,
        },
        {
          title: `Shopee: ${query} - Varian 2`,
          price: 250000,
          image: "https://placehold.co/400x400?text=Shopee+V2",
          link: "https://shopee.co.id/product-2",
          description: `Varian kedua untuk: ${query}`,
        },
      ],
    };

    return mockResponse.items.map((item) => ({
      title: item.title,
      price: item.price,
      currency: "IDR",
      imageUrl: item.image,
      videoUrl: null,
      description: item.description ?? null,
      sourceUrl: item.link,
      source: ProductSource.Shopee,
    }));
  }

  async extract(url: string): Promise<ProductSearchResult> {
    const { scrapeFromUrl } = await import("@/lib/products/scraper");
    return scrapeFromUrl(url);
  }
}

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const provider = new ShopeeProvider();
  return provider.search(query);
}
