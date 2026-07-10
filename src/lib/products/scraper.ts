import * as cheerio from "cheerio";
import type { ProductSearchResult } from "@/types/product";
import { ProductSource } from "@/lib/constants";

function detectSource(url: string): ProductSource {
  if (url.includes("shopee")) return ProductSource.Shopee;
  if (url.includes("amazon")) return ProductSource.Amazon;
  return ProductSource.Manual;
}

export async function scrapeFromUrl(url: string): Promise<ProductSearchResult> {
  const source = detectSource(url);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text() ||
      "Unknown Product";

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      null;

    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;

    const priceText = $('meta[property="product:price:amount"]').attr("content") || null;

    const price = priceText ? parseFloat(priceText) : 0;
    const currency =
      $('meta[property="product:price:currency"]').attr("content") || "IDR";

    return {
      title: title.trim(),
      price,
      currency,
      imageUrl,
      videoUrl: null,
      description,
      sourceUrl: url,
      source,
    };
  } catch {
    return {
      title: "Product from URL",
      price: 0,
      currency: "IDR",
      imageUrl: null,
      videoUrl: null,
      description: `Product from: ${url}`,
      sourceUrl: url,
      source,
    };
  }
}
