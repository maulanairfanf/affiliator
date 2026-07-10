import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generate } from "@/lib/contents/service";
import { getProduct } from "@/lib/db/products";
import { generateContentSchema } from "@/lib/validation/schemas";
import type { GenerationRequest } from "@/types/content";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateContentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const product = await getProduct(parsed.data.productId);
    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const stream = await generate(parsed.data as GenerationRequest);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to generate content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
