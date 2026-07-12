import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scrapeFromUrl } from "@/lib/products/scraper";
import { z } from "zod";

const scrapeSchema = z.object({
  url: z.string().url("Invalid URL"),
});

function isAffiliateLink(url: string): boolean {
  return (
    url.includes("s.shopee.co.id") ||
    url.includes("sp_atk=") ||
    url.includes("utm_source=an_") ||
    url.includes("utm_medium=affiliates") ||
    url.includes("adtag=")
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = scrapeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid URL", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const url = parsed.data.url;
    const result = await scrapeFromUrl(url);
    const affiliateUrl = isAffiliateLink(url) ? url : null;

    return NextResponse.json({ data: result, affiliateUrl });
  } catch (error) {
    console.error("Failed to scrape URL:", error);
    return NextResponse.json({ error: "Failed to scrape URL" }, { status: 500 });
  }
}
