import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchProducts } from "@/lib/products/service";
import { ProductSource } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const source = (searchParams.get("source") as ProductSource) || ProductSource.Shopee;

    if (!query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = await searchProducts(query, source);
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Failed to search products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
