import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContents, createContent, deleteContent } from "@/lib/db/contents";
import { createContentSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contents = await listContents(session.user.id);
    return NextResponse.json({ data: contents });
  } catch (error) {
    console.error("Failed to list contents:", error);
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
    const parsed = createContentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, platform, type, content, templateId } = parsed.data;

    const created = await createContent({
      userId: session.user.id,
      productId: productId,
      platform,
      type,
      content,
      templateId,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Content ID required" }, { status: 400 });
    }

    await deleteContent(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
