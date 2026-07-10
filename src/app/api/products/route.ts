import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listProducts, createProduct } from "@/lib/db/products";
import { createProductSchema } from "@/lib/validation/schemas";
import type { ProductFilter, ProductFormData } from "@/types/product";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") ?? undefined;
    const filter = {
      source: source as ProductFilter["source"],
      search: searchParams.get("q") ?? undefined,
    };

    const products = await listProducts(session.user.id, filter);
    return NextResponse.json({ data: products });
  } catch (error) {
    console.error("Failed to list products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const product = await createProduct({
      ...(parsed.data as ProductFormData),
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
