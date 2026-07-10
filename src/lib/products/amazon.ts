import type { ProductSearchResult } from "@/types/product";
import { ProductSource } from "@/lib/constants";
import type { ProductProvider } from "@/lib/products/provider";

interface AmazonSearchResponse {
  items: Array<{
    title: string;
    price: number;
    image: string;
    link: string;
    description?: string;
  }>;
}

export class AmazonProvider implements ProductProvider {
  source = ProductSource.Amazon;

  async search(query: string): Promise<ProductSearchResult[]> {
    const mockResponse: AmazonSearchResponse = {
      items: [
        {
          title: `Amazon: ${query}`,
          price: 29.99,
          image: "https://placehold.co/400x400?text=Amazon+Product",
          link: "https://amazon.com/dp/product",
          description: `Amazon search result for: ${query}`,
        },
        {
          title: `Amazon: ${query} - Premium`,
          price: 49.99,
          image: "https://placehold.co/400x400?text=Amazon+Premium",
          link: "https://amazon.com/dp/product-2",
          description: `Premium variant for: ${query}`,
        },
      ],
    };

    return mockResponse.items.map((item) => ({
      title: item.title,
      price: item.price,
      currency: "USD",
      imageUrl: item.image,
      videoUrl: null,
      description: item.description ?? null,
      sourceUrl: item.link,
      source: ProductSource.Amazon,
    }));
  }

  async extract(url: string): Promise<ProductSearchResult> {
    const { scrapeFromUrl } = await import("@/lib/products/scraper");
    return scrapeFromUrl(url);
  }
}

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const provider = new AmazonProvider();
  return provider.search(query);
}
