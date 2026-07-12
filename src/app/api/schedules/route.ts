import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listSchedules, createSchedule, deleteSchedule, updateSchedule } from "@/lib/db/schedules";
import { getProduct } from "@/lib/db/products";
import { getContent } from "@/lib/db/contents";
import { createScheduleSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await listSchedules({ userId: session.user.id, search, status, startDate, endDate, page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list schedules:", error);
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
    const parsed = createScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, contentId, platform, scheduledAt } = parsed.data;

    if (productId) {
      const product = await getProduct(productId);
      if (!product || product.userId !== session.user.id) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }

    const content = await getContent(contentId);
    if (!content || content.userId !== session.user.id) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const schedule = await createSchedule({
      userId: session.user.id,
      productId: productId || undefined,
      contentId,
      platform,
      scheduledAt: new Date(scheduledAt),
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    const updated = await updateSchedule(id, session.user.id, {
      scheduledAt: new Date(),
      status: "pending",
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    await deleteSchedule(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
