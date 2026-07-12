import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContents, createContent, deleteContent, updateContent } from "@/lib/db/contents";
import { createContentSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await listContents({ userId: session.user.id, search, platform, page, pageSize });
    return NextResponse.json(result);
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

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, content, title } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    const updated = await updateContent(id, session.user.id, { content, title });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update content:", error);
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
