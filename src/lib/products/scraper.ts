import * as cheerio from "cheerio";
import type { ProductSearchResult } from "@/types/product";
import { ProductSource } from "@/lib/constants";

const DEBUG = process.env.DEBUG === "scraper";

function logDebug(...args: unknown[]) {
  if (DEBUG) console.error("[Scraper]", ...args);
}

function detectSource(url: string): ProductSource {
  if (url.includes("shopee")) return ProductSource.Shopee;
  if (url.includes("amazon")) return ProductSource.Amazon;
  return ProductSource.Manual;
}

const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

async function fetchAsCrawler(url: string): Promise<{ html: string; finalUrl: string; debug: Record<string, unknown> }> {
  const debug: Record<string, unknown> = { originalUrl: url };

  // Step 1: Chrome UA to follow short link redirects
  const chromeRes = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": CHROME_UA },
  });
  debug.chromeStatus = chromeRes.status;
  debug.chromeUrl = chromeRes.url;

  // Step 2: Crawler UA on the real URL to get server-rendered HTML
  const crawlerRes = await fetch(chromeRes.url, {
    redirect: "follow",
    headers: { "User-Agent": CRAWLER_UA },
  });

  debug.finalStatus = crawlerRes.status;
  debug.finalUrl = crawlerRes.url;
  debug.contentType = crawlerRes.headers.get("content-type") || null;

  const html = await crawlerRes.text();
  debug.htmlLength = html.length;
  debug.htmlPreview = html.slice(0, 2000);

  return { html, finalUrl: crawlerRes.url, debug };
}

function extractJsonLd($: cheerio.CheerioAPI): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const product =
        json["@type"] === "Product"
          ? json
          : json["@graph"]?.find(
              (g: Record<string, unknown>) => g["@type"] === "Product"
            );
      if (product) {
        if (product.name) data.name = product.name;
        if (product.description) data.description = product.description;
        if (product.offers?.price)
          data.price = parseFloat(product.offers.price);
        if (product.offers?.priceCurrency)
          data.currency = product.offers.priceCurrency;
        if (product.image) {
          data.image = Array.isArray(product.image)
            ? product.image[0]
            : product.image;
        }
      }
    } catch {
      // skip invalid JSON-LD
    }
  });
  return data;
}

function extractShopItem(url: string): { shopId: string; itemId: string } | null {
  const match = url.match(/i\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { shopId: match[1], itemId: match[2] };
}

async function scrapeShopeeFromApi(finalUrl: string): Promise<ProductSearchResult | null> {
  const ids = extractShopItem(finalUrl);
  if (!ids) return null;

  logDebug("[Scraper] Shopee API: shopId=%s itemId=%s", ids.shopId, ids.itemId);

  const endpoints = [
    `https://shopee.co.id/api/v4/product/get_shop_item?shop_id=${ids.shopId}&item_id=${ids.itemId}`,
    `https://shopee.co.id/api/v2/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`,
    `https://shopee.co.id/api/v4/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`,
  ];

  for (const apiUrl of endpoints) {
    try {
      logDebug("[Scraper] Trying:", apiUrl);
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": CRAWLER_UA, Referer: "https://shopee.co.id/" },
      });

      const text = await res.text();
      logDebug("[Scraper] Status:", res.status, "| Body preview:", text.slice(0, 500));

      if (!res.ok) continue;

      let json: Record<string, unknown>;
      try { json = JSON.parse(text); } catch { continue; }

      const data = (json.data as Record<string, unknown>) || json;
      if (!data || !data.name) continue;

      const d = data as Record<string, unknown>;
      const price = d.price_min || d.price || 0;
      const images = d.images as string[] | undefined;
      const image = images?.[0]
        ? `https://down-id.img.susercontent.com/file/${images[0]}`
        : null;
      const description = d.description
        ? (d.description as string).replace(/<[^>]+>/g, "").trim()
        : null;

      logDebug("[Scraper] Shopee API success:", d.name, "| price:", price);
      return {
        title: (d.name as string).trim(),
        price: typeof price === "number" ? price : parseFloat(String(price)) || 0,
        currency: "IDR",
        imageUrl: image,
        videoUrl: null,
        description,
        sourceUrl: finalUrl,
        source: ProductSource.Shopee,
      };
    } catch (error) {
      console.error("[Scraper] API error:", error instanceof Error ? error.message : String(error));
    }
  }

  console.error("[Scraper] All Shopee APIs failed");
  return null;
}

function extractPriceFromText($: cheerio.CheerioAPI): number | null {
  const text = $("body").text();
  const patterns = [
    /Rp\s*([\d.,]+)/,
    /harga\s*:\s*Rp\s*([\d.,]+)/i,
    /price["']?\s*:\s*["']?([\d.]+)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

function extractMeta($: cheerio.CheerioAPI, html: string) {
  return {
    ogTitle: $('meta[property="og:title"]').attr("content") || null,
    ogUrl: $('meta[property="og:url"]').attr("content") || null,
    twitterTitle: $('meta[name="twitter:title"]').attr("content") || null,
    pageTitle:
      $("title").text().trim() ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null,
    ogDescription: $('meta[property="og:description"]').attr("content") || null,
    metaDescription: $('meta[name="description"]').attr("content") || null,
    ogImage: $('meta[property="og:image"]').attr("content") || null,
    twitterImage: $('meta[name="twitter:image"]').attr("content") || null,
    metaPrice: $('meta[property="product:price:amount"]').attr("content") || null,
    metaCurrency: $('meta[property="product:price:currency"]').attr("content") || null,
  };
}

export async function scrapeFromUrl(url: string): Promise<ProductSearchResult> {
  const source = detectSource(url);

  // Fetch HTML with crawler UA (after Chrome UA follows short link redirects)
  try {
    const { html, finalUrl, debug } = await fetchAsCrawler(url);
    const $ = cheerio.load(html);
    const meta = extractMeta($, html);
    const ld = extractJsonLd($);
    const h1 = $("h1").first().text().trim() || null;

    const title =
      meta.ogTitle ||
      (ld.name as string) ||
      meta.twitterTitle ||
      meta.pageTitle ||
      h1 ||
      "Unknown Product";

    const description = meta.ogDescription || (ld.description as string) || meta.metaDescription || null;
    const imageUrl = meta.ogImage || (ld.image as string) || meta.twitterImage || null;
    let price = meta.metaPrice ? parseFloat(meta.metaPrice) : (ld.price as number) || 0;
    const currency = meta.metaCurrency || (ld.currency as string) || "IDR";

    if (!price) {
      const htmlPrice = extractPriceFromText($);
      if (htmlPrice) price = htmlPrice;
    }

    logDebug("[Scraper] ────────────────");
    logDebug("[Scraper] Original URL:", debug.originalUrl);
    logDebug("[Scraper] Chrome status:", debug.chromeStatus, "| URL:", debug.chromeUrl);
    logDebug("[Scraper] Crawler status:", debug.finalStatus, "| URL:", debug.finalUrl);
    logDebug("[Scraper] Content-Type:", debug.contentType);
    logDebug("[Scraper] HTML size:", debug.htmlLength, "chars");
    logDebug("[Scraper] <title>:", meta.pageTitle || "—");
    logDebug("[Scraper] og:title:", meta.ogTitle || "—");
    logDebug("[Scraper] og:url:", meta.ogUrl || "—");
    logDebug("[Scraper] og:image:", meta.ogImage?.slice(0, 80) || "—");
    logDebug("[Scraper] og:description:", meta.ogDescription?.slice(0, 80) || "—");
    logDebug("[Scraper] product:price:", meta.metaPrice || "—");
    logDebug("[Scraper] JSON-LD name:", ld.name || "—");
    logDebug("[Scraper] HTML price:", price > 0 ? price : "—");
    logDebug("[Scraper] Final title:", title);
    logDebug("[Scraper] Final price:", price);
    logDebug("[Scraper] ────────────────");

    // If HTML didn't have price but it's a Shopee URL, try the API
    if (!price && source === ProductSource.Shopee) {
      const apiResult = await scrapeShopeeFromApi(debug.finalUrl as string);
      if (apiResult) {
        return {
          ...apiResult,
          title: title !== "Unknown Product" ? title : apiResult.title,
          description: description || apiResult.description,
          imageUrl: imageUrl || apiResult.imageUrl,
          sourceUrl: url,
        };
      }
    }

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
  } catch (error) {
    console.error("[Scraper] Error:", error instanceof Error ? error.message : String(error));
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
