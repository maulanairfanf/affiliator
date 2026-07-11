import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scrapeFromUrl } from "@/lib/products/scraper";
import { z } from "zod";

const scrapeSchema = z.object({
  url: z.string().url("Invalid URL"),
});

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

    const result = await scrapeFromUrl(parsed.data.url);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to scrape URL:", error);
    return NextResponse.json({ error: "Failed to scrape URL" }, { status: 500 });
  }
}
